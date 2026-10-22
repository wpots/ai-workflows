- `skills/compact-sprint/scripts/check-changelog-keys.mjs`: compares the
  original and the compact changelog and fails when a ticket that headed a
  table row is gone; reports keys named only in prose and the size against the
  15 KB template target. Tests in `scripts/test-compact-sprint-check-keys.mjs`,
  run by `scripts/validate-ai-instructions.sh`.
- Eval `close-sprint-7`: the support-month JQL and the ticket-key grep.
