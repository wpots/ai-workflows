This is a hard rule, not a preference. It applies whenever you work in a
canonical config repo (`ai-workflows`, `unicore-template`) **or** run an
upstream skill (`upstream-rules`, `upstream-to-unicore`) from any project.

- NEVER commit or push to `main` (or the template's target branch) directly —
  not for a one-line doc fix, not even when the push would succeed.
- Always: feature branch off the latest remote base → commit → push → open a
  **GitLab MR** on the canonical GitLab remote (resolve that remote by URL,
  never by assuming its name).
- `ai-workflows` is the **only** repo whose reviewer is named in the rules:
  request review from the maintainer, `wieteke.pots`, on an `ai-workflows` MR —
  `glab mr create … --reviewer wieteke.pots`, or on an MR that already exists
  `glab mr update <iid> -R greenberrynl/config/ai-workflows --reviewer wieteke.pots`.
  Everywhere else — `unicore-template`, client projects, anything — open the MR
  with **no `--reviewer` flag** and let the human assign one. Never infer a
  reviewer from CODEOWNERS, repo members, or git history, and never assign the
  MR author; only pass `--reviewer` when the user named that person.
- Pass **both** `-R <canonical-repo>` and `-H <canonical-repo>` to
  `glab mr create`, and `-R` to every follow-up `glab mr update`/`view`. `-R`
  sets only the target; the head (source) project and the MR lookup still
  default to the **current directory's** git remote. Run these from the
  originating project — normal, and unavoidable for an agent that may not `cd`
  — and MR creation fails with
  `422 [Source project is not a fork of the target project]`. Do not fall back
  to `glab api …/merge_requests`: `--field "reviewer_ids[]=<id>"` sends the
  bracket as a literal JSON key and silently opens the MR with no reviewer.
- When the MR changes what the `greenberry` plugin ships or how it behaves —
  `skills/`, `commands/`, `.claude-plugin/`, `hooks/`, a script a hook runs, or
  the ambient layer (`CLAUDE.md`, `rules/communication.md`,
  `rules/project.md`, `rules/clean-architecture.md`) — describe it under
  `## [Unreleased]` in `CHANGELOG.md` and **do not touch the `version` in
  `.claude-plugin/plugin.json`**. The number is assigned after merge, by
  `node scripts/assign-plugin-version.mjs --write` in its own small release MR.
  Claiming a version inside a content MR is what makes concurrent MRs collide:
  every one of them edits the same manifest line and inserts at the same
  changelog position, so whoever merges second conflicts and carries a number
  that is already on `main` — and a version that goes backwards is invisible in
  `/plugin`, since the install path is version-keyed.
- An `ai-workflows` MR without that reviewer is not done. Confirm it with
  `glab mr view <iid> -R greenberrynl/config/ai-workflows` before reporting, and
  report the real MR URL — never claim an MR or a reviewer the CLI did not
  confirm.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
