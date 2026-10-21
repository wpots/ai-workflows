- `skills/close-sprint`, `skills/compact-sprint`: read the runbook from the
  plugin root, not the project's synced `commands/` copy, which can lag and
  miss whole phases (one lacked 5b, 5c and the link sweep).
- `commands/close-sprint.md` support mode: the month window is `statusCategory
  = Done AND statusCategoryChangedDate`, not `resolved`. A Done transition that
  sets no resolution left `resolved` empty, so the query returned nothing
  without an error.
- `commands/close-sprint.md` Phase 2: `git log --grep` takes `-E` and
  `<TICKET>([^0-9]|$)`. A bare key also matched longer keys (`RFW-29` against
  `RFW-291`), and `\b` is no word boundary in git's regex on macOS, so it found
  nothing without an error.
- `commands/compact-sprint.md`: the sweep covers the whole repository, not only
  `docs/`. A reference from code, tests or config is left for its own MR
  instead of being rewritten, and the file it names stays in the folder, so
  `git rm -r` no longer deletes a file the Phase 4 note says never to remove.
  Harvest items read from a BLI are marked `verify`; changelog lines that claim
  a code state are re-checked before they are copied; the handover tag command
  names the sha.
