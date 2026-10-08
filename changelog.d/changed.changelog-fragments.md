- Changelog entries are fragments now: a content MR adds one file
  `changelog.d/<section>.<slug>.md` (`added`, `changed`, `fixed`, …) with its
  `- ` bullets instead of editing `## [Unreleased]`, so two MRs never conflict
  on the changelog again. `scripts/assign-plugin-version.mjs` assembles the
  fragments (and any entries still under Unreleased) into the `## [x.y.z]`
  section in Keep a Changelog order and deletes them; the `release_train` job
  stages that; `validate-skills.mjs` rejects a misnamed or empty fragment. The
  MR rule in `CLAUDE.md`/`AGENTS.md` and `docs/contributing.md` describe it.
