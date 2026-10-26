# Shared Workflow Assets Land via MR — Reference

The full rule behind every change to `ai-workflows` and `unicore-template`.
`upstream-rules`, `upstream-to-unicore` and `improve-skill` read it before they
branch: it is not in the always-on `CLAUDE.md`, so a session in another project
only has it once one of them loads this file. Generated from
`shared/upstream-mr.md` by `scripts/generate-adapters.sh` — edit the fragment,
never this copy.

<!-- BEGIN SHARED:upstream-mr -->
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
- Every MR an agent opens carries the provenance label `ai:agent-authored`, in
  every repo: `glab mr create … --label "ai:agent-authored"`, or
  `"labels": "ai:agent-authored"` in the JSON of the `--input` route below.
  A squash merge drops the `Co-Authored-By` trailers, so the label is the only
  record `scripts/delivery-metrics.mjs` can count (`rules/git-flow.md`).
- Before the MR opens, select only eval cases that exercise behavior changed
  by the branch. "Before a skill MR" in `evals/README.md` of `ai-workflows`
  owns the case selection, capped commands and result line. Whole skill
  suites, the routing suite, extra repetitions or a no-plugin arm require the
  user's explicit approval of scope and total budget; an MR request does not
  grant that approval. Repositories without `evals/` skip this step.
- Pass **both** `-R <canonical-repo>` and `-H <canonical-repo>` to
  `glab mr create`, and `-R` to every follow-up `glab mr update`/`view`. `-R`
  sets only the target; the head (source) project and the MR lookup still
  default to the **current directory's** git remote. Run these from the
  originating project — normal, and unavoidable for an agent that may not `cd`
  — and MR creation fails with
  `422 [Source project is not a fork of the target project]`.
- `glab mr create` cannot carry a real MR body: there is no
  `--description-file`, `-d` takes a string, and `-d -` opens an editor. For any
  body with backticks or tables, POST to `…/merge_requests` with
  `--input <file>` and `-H "Content-Type: application/json"`, with the label in
  that JSON, then attach the reviewer in a second call with `glab mr update`.
  Never pass the reviewer as `--field "reviewer_ids[]=<id>"` — the bracket goes
  over as a literal JSON key and the MR opens with no reviewer.
- GitLab **accepts** a review request from the MR author, so `wieteke.pots`
  reviewing their own `ai-workflows` MR is expected, not a conflict with the
  never-assign-the-author line above — that line governs repos where a reviewer
  would be a guess.
- When the MR changes what the `greenberry` plugin ships or how it behaves —
  `skills/`, `commands/`, `.claude-plugin/`, `hooks/`, a script a hook runs, or
  the ambient layer (`CLAUDE.md`, `rules/communication.md`,
  `rules/project.md`, `rules/clean-architecture.md`) — describe it in a
  changelog fragment `changelog.d/<added|changed|fixed|…>.<slug>.md` (its
  `- ` bullets, as they will read under the `### <Section>` heading) and **do
  not touch `CHANGELOG.md` or the `version` in `.claude-plugin/plugin.json`**.
  The release is cut after merge by the `release_train` CI job (or by hand
  with `node scripts/assign-plugin-version.mjs --write`), which assembles the
  fragments into the `## [x.y.z]` section and assigns the number. Two MRs
  editing `## [Unreleased]` conflicted on the same lines whenever both were
  open; two fragment files never do. Claiming a version inside a content MR is
  worse still: every MR would edit the same manifest line, so whoever merges
  second carries a number already on `main` — and a version that goes
  backwards is invisible in `/plugin`, since the install path is version-keyed.
- An `ai-workflows` MR without that reviewer is not done. Confirm it with
  `glab mr view <iid> -R greenberrynl/config/ai-workflows` before reporting, and
  report the real MR URL — never claim an MR or a reviewer the CLI did not
  confirm. The same read-back confirms the `ai:agent-authored` label on an MR
  in any repo; when it is missing, add it with
  `glab mr update <iid> -R <canonical-repo> --label "ai:agent-authored"`.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
<!-- END SHARED:upstream-mr -->
