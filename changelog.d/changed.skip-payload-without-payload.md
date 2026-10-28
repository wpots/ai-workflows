- Project sync (`scripts/sync.sh --project`, also run by the SessionStart
  freshness hook's fix step) and `setup-ai-workflows` leave Payload out of
  projects that do not depend on `payload` or `@payloadcms/*`:
  `rules/payload.md` is not synced and a copy an earlier sync left behind is
  removed, and the template and `rules/rules.md` lines marked
  `<!-- payload-only -->` are dropped from `AGENTS.md`, `AI-WORKFLOWS.md` and
  `rules/rules.md`. Projects with Payload get the same files, with the marker
  left in as an invisible HTML comment. In `rules/rules.md` the `payload.md`
  loading trigger moves to the end of the list, so removing it leaves no gap in
  the numbering.
  <!-- slack: sync.sh | Projecten zonder Payload krijgen geen rules/payload.md en Payload-verwijzingen meer -->
