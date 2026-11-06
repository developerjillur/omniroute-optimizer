"""Attach a source-verified publication lock without rebuilding compiled assets."""
import argparse
import copy
import gzip
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import tarfile
from urllib.parse import urlparse


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(filename):
    digest = hashlib.sha256()
    with Path(filename).open("rb") as stream:
        for data in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(data)
    return digest.hexdigest()


def inventory(archive):
    result = {}
    with tarfile.open(archive, "r|gz") as stream:
        for member in stream:
            parts = PurePosixPath(member.name).parts
            require(parts and parts[0] == "package" and ".." not in parts,
                    "Archive path escapes the package")
            require(not PurePosixPath(member.name).is_absolute(), "Absolute archive path")
            require(member.name not in result, "Duplicate archive member")
            digest = hashlib.sha256()
            if member.isfile():
                source = stream.extractfile(member)
                for data in iter(lambda: source.read(1024 * 1024), b""):
                    digest.update(data)
            result[member.name] = {
                "size": member.size, "mode": member.mode,
                "type": member.type.hex(), "linkname": member.linkname,
                "sha256": digest.hexdigest() if member.isfile() else None,
            }
    return result


def seal(archive, source_lock, publication_lock, output, effective_edges=None):
    archive, source_lock, publication_lock, output = map(
        Path, (archive, source_lock, publication_lock, output)
    )
    require(not output.exists(), "Retain the existing archive and use a new output")
    require(output.parent.is_dir(), "Create and review the output directory first")
    source = json.loads(source_lock.read_text())
    lock_bytes = publication_lock.read_bytes()
    lock = json.loads(lock_bytes)
    require(lock.get("lockfileVersion") == 3, "Publication requires lockfile version 3")
    with tarfile.open(archive, "r:gz") as stream:
        metadata = json.load(stream.extractfile("package/package.json"))
    require(lock.get("name") == metadata["name"] and
            lock.get("version") == metadata["version"], "Publication identity mismatch")
    for field in ("dependencies", "optionalDependencies"):
        require(lock["packages"][""].get(field, {}) == metadata.get(field, {}),
                "Published runtime dependencies differ from the publication lock")
        require(source["packages"][""].get(field, {}) == metadata.get(field, {}),
                "Published runtime dependencies differ from the validated source")
    expected_lock = copy.deepcopy(source)
    expected_lock["packages"] = {
        location: entry for location, entry in expected_lock["packages"].items()
        if not location or (location.startswith("node_modules/") and not entry.get("link"))
    }
    expected_lock["packages"][""].pop("workspaces", None)
    expected_lock["packages"][""].pop("devDependencies", None)
    changes = []
    if effective_edges is not None:
        recipe = json.loads(Path(effective_edges).read_text())
        require(recipe.get("sourceLockSHA256") == sha(source_lock), "Override recipe source drift")
        require(recipe.get("sourceOverrides") == metadata.get("overrides", {}),
                "Override recipe policy differs from the published source")
        changes = recipe["changes"]
        seen = set()
        for change in changes:
            location, field, name = change["location"], change["field"], change["name"]
            require((location, field, name) not in seen, "Duplicate override edge")
            seen.add((location, field, name))
            require(location in expected_lock["packages"] and location,
                    "Override origin is absent from the publication lock")
            require(field in ("dependencies", "optionalDependencies", "devDependencies", "peerDependencies"),
                    "Unexpected dependency edge field")
            entry = expected_lock["packages"][location]
            require(entry.get(field, {}).get(name) == change["before"], "Override source edge drift")
            target = expected_lock["packages"].get(change["targetLocation"])
            require(target and target.get("version") == change["after"], "Override target drift")
            target_name = target.get("name") or change["targetLocation"].rsplit("node_modules/", 1)[-1]
            require(target_name == name and change["effectiveSpec"] != change["before"],
                    "Override recipe is not an effective source edge")
            entry[field][name] = change["after"]
    for location, entry in lock["packages"].items():
        if not location:
            continue
        require(location.startswith("node_modules/") and ".." not in PurePosixPath(location).parts,
                "Non-publication dependency location")
        require(not entry.get("link"), "Development workspace links cannot be published")
        expected = source["packages"].get(location)
        require(expected is not None, "Publication dependency is absent from validated source")
        for field in ("version", "resolved", "integrity"):
            require(entry.get(field) == expected.get(field),
                    "Publication dependency drift: " + location + " (" + field + ")")
        if entry.get("resolved"):
            url = urlparse(entry["resolved"])
            require(url.scheme == "https" and url.hostname == "registry.npmjs.org" and
                    not url.username and not url.password,
                    "Dependency resolution is not a reviewed public registry URL")
            require(bool(entry.get("integrity")), "Registry integrity is missing")
    require(lock == expected_lock, "Publication metadata differs from source and reviewed effective edges")
    before = inventory(archive)
    require("package/npm-shrinkwrap.json" not in before, "Archive already has a publication lock")
    # Local tarball manifests do not get the registry's shrinkwrap discovery flag.
    # npm Arborist uses this metadata to load the nested published lock.
    sealed_metadata = dict(metadata, _hasShrinkwrap=True)
    metadata_bytes = (json.dumps(sealed_metadata, indent=2, ensure_ascii=False) + "\n").encode()
    with output.open("xb") as destination:
        with gzip.GzipFile(fileobj=destination, mode="wb", mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode="w|", format=tarfile.PAX_FORMAT) as target:
                with tarfile.open(archive, "r|gz") as original:
                    stamp = 0
                    for member in original:
                        content = original.extractfile(member) if member.isfile() else None
                        member = copy.copy(member)
                        if member.name == "package/package.json":
                            stamp = member.mtime
                            member.size = len(metadata_bytes)
                            content = io.BytesIO(metadata_bytes)
                        target.addfile(member, content)
                    member = tarfile.TarInfo("package/npm-shrinkwrap.json")
                    member.mode, member.mtime, member.size = 0o644, stamp, len(lock_bytes)
                    target.addfile(member, io.BytesIO(lock_bytes))
    after = inventory(output)
    require(set(after) == set(before) | {"package/npm-shrinkwrap.json"}, "Unexpected archive change")
    require(all(after[name] == entry for name, entry in before.items()
                if name != "package/package.json"),
            "A compiled or original package member changed")
    return {
        "status": "SEALED_PACKAGE_CREATED_NOT_ACCEPTED",
        "originalArchive": str(archive), "originalSHA256": sha(archive),
        "archive": str(output), "sha256": sha(output), "bytes": output.stat().st_size,
        "sourceLockSHA256": sha(source_lock), "publicationLockSHA256": sha(publication_lock),
        "originalMembersPreserved": len(before) - 1, "compiledAssetsUnchanged": True,
        "addedMembers": ["package/npm-shrinkwrap.json"],
        "metadataChanges": ["package/package.json:_hasShrinkwrap=true"],
        "effectiveSourceOverrideEdges": len(changes),
        "effectiveEdgesSHA256": sha(effective_edges) if effective_edges else None,
        "actualGlobalInstallAuditRequired": True, "livePromotionPerformed": False,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive")
    parser.add_argument("source_lock")
    parser.add_argument("publication_lock")
    parser.add_argument("output")
    parser.add_argument("--effective-edges")
    args = parser.parse_args()
    receipt = seal(args.archive, args.source_lock, args.publication_lock, args.output, args.effective_edges)
    filename = Path(args.output + ".receipt.json")
    with filename.open("x") as stream:
        json.dump(receipt, stream, indent=2)
        stream.write("\n")
    print(json.dumps(receipt))
