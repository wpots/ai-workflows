This is a hard rule, not a preference. It applies whenever you work in a
canonical config repo (`ai-workflows`, `unicore-template`) **or** run an
upstream skill (`upstream-rules`, `upstream-to-unicore`) from any project.

- NEVER commit or push to `main` (or the template's target branch) directly —
  not for a one-line doc fix, not even when the push would succeed.
- Always: feature branch off the latest remote base → commit → push → open a
  **GitLab MR** on the canonical GitLab remote (resolve that remote by URL,
  never by assuming its name).
- Always request review from the maintainer, `wieteke.pots`, on that MR:
  `glab mr create … --reviewer wieteke.pots`. On an MR that already exists:
  `glab mr update <iid> -R <canonical-repo> --reviewer wieteke.pots`.
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
  `rules/project.md`, `rules/clean-architecture.md`) — bump the `version` in
  `.claude-plugin/plugin.json` and add the matching `CHANGELOG.md` entry in
  the same MR. The install path is version-keyed, so an unbumped release is
  invisible in `/plugin` and indistinguishable from the previous one.
- An MR without that reviewer is not done. Confirm it with
  `glab mr view <iid>` before reporting, and report the real MR URL — never
  claim an MR or a reviewer the CLI did not confirm.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
