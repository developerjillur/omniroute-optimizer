"""Extract a reviewed npm archive into a new package directory without outside writes."""
import argparse
from pathlib import Path, PurePosixPath
import posixpath
import tarfile


def extract(archive, destination):
    destination = Path(destination)
    if destination.exists():
        raise ValueError("Preserve the existing package directory")
    with tarfile.open(archive, "r:gz") as source:
        members = source.getmembers()
        seen = set()
        for member in members:
            parts = PurePosixPath(member.name).parts
            if (not parts or parts[0] != "package" or ".." in parts or
                    PurePosixPath(member.name).is_absolute() or member.name in seen):
                raise ValueError("Unsafe or duplicate publication path")
            seen.add(member.name)
            if not (member.isfile() or member.isdir() or member.issym() or member.islnk()):
                raise ValueError("Special publication file type is not allowed")
            if member.issym() or member.islnk():
                target = (posixpath.normpath(posixpath.join(posixpath.dirname(member.name), member.linkname))
                          if member.issym() else posixpath.normpath(member.linkname))
                if not target.startswith("package/") or PurePosixPath(member.linkname).is_absolute():
                    raise ValueError("Publication link escapes the package")
        destination.mkdir(mode=0o700)
        root = destination.resolve()
        for member in members:
            member.name = "/".join(PurePosixPath(member.name).parts[1:])
            if not member.name:
                continue
            if member.islnk():
                member.linkname = "/".join(PurePosixPath(member.linkname).parts[1:])
            parent = (root / member.name).parent.resolve()
            if parent != root and not parent.is_relative_to(root):
                raise ValueError("Publication parent escapes the destination")
            member.mode &= 0o777
            # The complete member/link allowlist was checked before the first write.
            source.extract(member, destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive")
    parser.add_argument("destination")
    args = parser.parse_args()
    extract(args.archive, args.destination)
