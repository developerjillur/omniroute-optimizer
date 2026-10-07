# GPT 6.1 Sol: local Codex routing

Maintained by Jillur Rahman. Review date: 2026-10-04.

## Problem and resulting behavior

The connected Codex account exposed `gpt-6.1-sol` in the current native catalog, but
OmniRoute's static registry did not include it. A request was rejected locally before
reaching the provider. Adding a custom model exposed a second compatibility issue:
the default client identity failed upstream while the installed native client's
`0.160.0` identity succeeded. The existing executor also silently clamped this
model's requested `max` effort to `xhigh`.

The overlay adds the native model and its six effort aliases, allows the verified
`max`/`ultra` levels, and updates the default Codex client identity to `0.160.0`.
Existing forwarding of a newer native caller's version remains enabled. The Docker
CLI pin matches the shared default, as required by the existing identity tests.

## Durable files

| Overlay file                                                           | Effect                                                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `patches/open-sse__config__providers__registry__codex__index.ts.patch` | Native base model and six effort aliases, Responses format, tools, vision, and context metadata         |
| `patches/open-sse__executors__codex__reasoningSuffix.ts.patch`         | Register this model in the max and ultra effort sets                                                    |
| `patches/open-sse__services__model.ts.patch`                           | Keep native unprefixed model ids and their aliases routed to Codex                                      |
| `patches/src__shared__constants__codexClient.ts.patch`                 | Default identity `0.160.0`                                                                              |
| `patches/Dockerfile.patch`                                             | Keep the Codex CLI pin aligned, preserving the prior Docker overlay                                     |
| `new/tests/unit/gpt-6-1-sol-support.test.ts`                           | Regression tests for catalog metadata, alias resolution, effort preservation, and later caller versions |

No native app account, project, history, or app bundle needs modification for this
change. All source modifications stay under `nexa/`; applying them during a build is
temporary. Restore the applied tree before committing.

## Model and effort contract

Use `gpt-6.1-sol`, `codex/gpt-6.1-sol`, or `cx/gpt-6.1-sol` with an explicit `reasoning.effort`.
The available suffixes are `-low`, `-medium`, `-high`, `-xhigh`, `-max`, and `-ultra`.
Every suffix resolves to the same upstream base model, `gpt-6.1-sol`.

`max` remains `max` on the provider request. OmniRoute's existing ultra alias uses
upstream `max`; it does not add the native client's delegation behavior to an ordinary
API call. A suffix wins over a conflicting request-body effort, following the existing
Codex alias contract.

The native catalog reports `context_window=272000`, `max_context_window=872000`, and
`effective_context_window_percent=95`. The registry uses the 872000 maximum, following
the existing Codex capability definition. This is catalog evidence, not a test of an
872000-token prompt. The shared 128000 output-token metadata is also inherited from
the existing Codex registry; a full output-limit stress test is outside this change.

Primary reference: [OpenAI Codex models manifest](https://raw.githubusercontent.com/openai/codex/refs/heads/main/codex-rs/models-manager/models.json).
The connected account's actual entitlement still decides whether a model request
succeeds.

## Configuration and deployment

Safe account discovery may be enabled with the connection's `autoFetchModels=true`
and `codexDiscoveryMode=safe`. Refreshing discovery alone did not fix the older runtime.

A temporary custom model and connection-specific `Version`/User-Agent settings can
prove the upstream path before deployment. Once the patched default is verified in
the installed runtime, remove only those temporary identity overrides. Leaving a fixed
connection override would prevent later native clients from forwarding their own
version. The custom model's default fallback context was initially 400000; its native
dashboard Context Window Override was set to the verified 872000 maximum. If retaining
this custom entry, keep its context consistent with the native catalog and verify that
the compiled registry supplies the same input-token metadata. The built-in entry also
supports deployments without that custom configuration.

The registry and executor are bundled into the production Next.js runtime. Editing
shipped TypeScript files alone does not update the compiled request handler. Build a
package with the normal overlay, test it on isolated ports and a private database copy,
and preserve one verified runtime rollback before promotion.

Use the existing bounded build runner with one worker, a 6144 MiB heap budget, and an
8192 MiB total-process RSS watchdog. Respect the disk-space gate. Avoid a Desktop-shell
or Docker rebuild when deploying only this backend model fix.

## Verification and update checks

The initial focused suite passed 28/28 tests with a measured peak of 493 MiB. The final
expanded suite passed 43/43 tests with a peak of 302 MiB, including native bare-id routing
and explicit provider precedence. Core typecheck passed. The full TypeScript ratchet
remained at its existing 5830-error baseline after
generating the docs source; the missing generated source initially added five errors.
The security regression gate passed 32/32 tests. These are local validation results,
not a claim that the repository's entire TypeScript backlog is clean.

For a release, verify the packaged base model and all effort aliases, a real Responses
request, streaming, requested versus upstream effort in call logs, and an existing-model
regression request. Check the existing Bridge health after promotion. Restore the
test key's original permissions in a `finally` block.

After an upstream update, run `node nexa/apply.mjs --check` before building. A patch
conflict must stop deployment with the working service retained. Re-test the model's
actual provider response and effort mapping after a Codex or OmniRoute update. No
configuration can guarantee compatibility with every future provider change.
