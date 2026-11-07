# Claude Code model IDs and Agent Bridge compatibility

The settings writer could save native Claude models as `cc/claude-…` IDs while
the desktop Code route used plain source IDs in Agent Bridge mappings. An
unmatched source fell through to the vendor, producing a misleading login/model
failure. Registry insertion order also selected older family defaults.

## Source changes

- Default Claude CLI settings use plain native IDs. Numeric versions and optional
  release dates determine family precedence; registry order does not.
- The writer merges requested fields into existing settings. Unrequested model
  choices, hooks, permissions and other settings remain. Existing Fable settings
  are independently managed and are not replaced or populated automatically.
- The dashboard previews redacted changes before applying them. A settings-file
  revision detects edits made between preview and apply. Preview does not create
  a settings file, backup or configured timestamp. Existing API clients retain
  their explicit-write contract; the dashboard uses preview and confirmation.
- Known `cc/` and `claude/` prefixes are normalized for native Claude source IDs.
  Explicit source mappings take precedence, followed by a configured wildcard.
  Explicit non-Claude routes remain explicit; they are not guessed or renamed.
- The provider registry and standalone Bridge share one native model catalog.
  Registered native models gain default routes without a database write or
  manual mapping step. The dashboard exposes the same derived defaults and
  preserves saved overrides. New catalog entries retain normal provider access
  and quota checks; catalog presence is not entitlement proof.
- An unmapped Claude Code source returns HTTP 400 with Anthropic
  `invalid_request_error` naming the source. It does not send that request to the
  vendor. Other agents retain their existing routing behavior.

The pre-existing native model metadata was preserved while extracting the shared
catalog. `claude-haiku-5-5` is added with an ID and name; no unverified capability
or context-window values are invented. The previous upstream test intentionally
selected Opus 5 over 5.5 for stale catalogs. That single expectation now follows
the requested newest-version policy; other Opus and protocol assertions remain.

## Validation and release status

Status at preparation: **source prepared; current-change CI and local acceptance
pending**. The focused regression lane executes the prior source first and
requires assertion failures, then the fixed source. Environment/import errors,
skips and resource stops do not count as a reproduced regression.

Coverage includes default/version selection, prefix normalization, exact and
wildcard priority, future registered models, unmapped errors, real settings-route
preview/apply against copies, preservation of owner fields, redacted auth,
revision conflicts and read-only derived mappings. Existing CLI, Opus and Bridge
regressions accompany the new tests. Provider generation calls in source tests
are zero.

The successful older application build `e43e5f9e4` predates these changes. It does
not contain this fix and cannot be promoted as the updated candidate. A fresh
production build, actual installed-dependency audit, isolated package acceptance
and controlled live promotion remain necessary. Initial local admission was
rejected with 7.45 GiB headroom and active media renders. No running app/session,
owner settings, live runtime, hosts or judge configuration was changed.

The live two-route matrix remains pending: default, haiku, sonnet, opus and
`cc/claude-haiku-5-5`, followed by one WebSearch request per route. Each run needs
matching provider/status log evidence. Fable generation is excluded. A healthy
dashboard or source CI does not establish this live matrix or cross-model output
quality parity.

## Separate Gemini judge finding

A read-only catalog request using the exact existing skill-family key returned
HTTP 200. It listed `agy/gemini-pro-agent`; it did not list the configured
`agy/gemini-3.1-pro-high` or `antigravity/gemini-3.1-pro-high` forms. The current
gateway source maps `gemini-3.1-pro-high` to `gemini-pro-agent` and labels the
latter Gemini 3.1 Pro (High).

The inspected family client selects only catalog-listed candidates for the
requested spelling. It does not resolve this gateway alias before rejecting an
unlisted spelling. This supports an explanation for the reported preflight
`not_listed` failure and subsequent Flash fallback; it does not prove an account
quota problem or that every historical failure had this cause.

Actual Pro inference, account entitlement, served identity and the supplied
seven-day call counts were not re-proved by this catalog request. No judge model
setting or independent skill-family repository was edited. Exact public IDs and
private read-only evidence are retained separately for the owner to review.
