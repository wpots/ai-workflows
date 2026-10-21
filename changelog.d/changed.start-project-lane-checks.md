- `skills/start-project` lane 0: the pre-flow check and check 3a count the
  template's tags next to its MRs and issues; check 4 wants `main` protected
  without force push once the history is replaced; new check 5b (CI include
  pinned to a ci-components release, one Node version across CI, `.nvmrc` and
  `engines`, gitleaks and the verify hooks, outdated-deployment and rollback
  settings) and 5c (encrypted env files, `.env.keys` ignored, the 1Password
  item present); check 6 reads Jira from the group-inherited
  `jira-cloud-app` integration instead of the per-project `jira` one.
- `skills/start-project` lane 2: service coordinates (tracker key and boards,
  channel ids, Figma, Notion and Drive links) land in `CONVENTIONS.md` §
  Tooling with a flag for client-visible, not final or confidential, because
  skills read them there; the table adds a Chat row, design status per file,
  the migration source's data classification and the `jira -p <KEY>` case.
- `skills/start-project` lane 3a: a retrofit harvests the merged MR
  descriptions since the first commit as decision-log candidates.
