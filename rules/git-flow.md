# Git Flow

> Apply these rules before branch operations, MR/PR reviews, rebases, conflict
> resolution and merge-readiness work, and when checking merge settings.

One slice, one branch, one MR, one commit on the default branch. Everything
between the branch point and the merge is scratch: only the squashed commit is
history, and only the MR carries metadata.

```
feature branch (n scratch commits) ── MR ──squash──▶ default branch (1 commit)
```

## Workspace isolation

The user's main checkout stays read-only during MR/PR review, review rework,
rebases, conflict resolution and merge-readiness work. Record its branch,
HEAD and dirty state first. Do the task in an isolated worktree outside the
repository and IDE-watched directories; setup and cleanup mechanics live in
`skills/create-pr/references/worktrees.md`.

A clean checkout, a request to make an MR mergeable, or a successful check
does not authorize switching its branch, stashing its edits, resetting it,
installing dependencies there or rewriting its generated files. A failed
worktree setup or check does not authorize falling back to that checkout.
Before reporting completion, verify its recorded state is unchanged.

## Project settings — the Greenberry baseline

Every repo. Check with `node scripts/gitlab-merge-settings.mjs` (read-only;
`--apply` writes, and only after an explicit go).

| Setting | Value | Why |
| --- | --- | --- |
| `merge_method` | `ff` | No merge commits: the default branch stays linear and bisectable |
| `squash_option` | `always` | One commit per reviewable slice; `git revert <sha>` reverts a whole feature |
| `squash_commit_template` | `%{title}`, blank line, `%{description}`, blank line, `See merge request %{reference}` | GitLab's default keeps only the title, so without this the reasoning never reaches the default branch |
| `remove_source_branch_after_merge` | `true` | Merged branch is dead weight; the MR is the record |
| `only_allow_merge_if_pipeline_succeeds` | `true` | A red pipeline may not become history |
| `only_allow_merge_if_all_discussions_are_resolved` | `true` | Makes the review gate real instead of advisory |

Approval by a human reviewer stays mandatory — see the reviewer rule in
`skills/create-pr`. *Who* that reviewer is, is a per-repo answer a human gives:
`ai-workflows` is the only repo that names one up front (`wieteke.pots`).
Everywhere else the MR is opened without a reviewer and the human assigns one.
In both canonical config repos (`ai-workflows`, `unicore-template`) no change
lands without an MR — not even a one-line doc fix.

## Squash is the default — and it has exactly one price

Agent-driven branches carry noise: fixup commits, regenerated artefacts,
"chore: rerun typegen". Squashing is worth *more* in that flow, not less. The
price is that the **MR title becomes the history**, so:

- the MR title is a conventional-commit subject — `type(scope): imperative`,
  ≤ 72 chars. It is the commit message; treat it with that weight
- the MR description is the commit body. Lead with what changed and why; keep
  checklists and ceremony below that
- branch commits stay conventional (they are what review reads) but are never
  load-bearing — never reference a branch SHA in a doc, ticket, or comment
- where the project's CI can, validate the MR title mechanically
  (`commitlint` over `CI_MERGE_REQUEST_TITLE` in a merge-request pipeline). A
  policy nobody checks decays into whatever the last hurried title was

## Provenance lives on the MR, not in the commit

A squash discards the individual commits, and with them every per-commit
trailer — including `Co-Authored-By: Claude`. `%{co_authored_by}` does **not**
recover it: that variable expands to the *authors* of the commits, not to the
trailers inside them. So provenance is MR metadata:

| Label | Set by | Meaning |
| --- | --- | --- |
| `ai:agent-authored` | `skills/create-pr`, on every MR it opens | The branch was written with agent assistance |
| `revert` | whoever opens the revert MR | Undoes a previously merged MR; name it in the description |

Labels survive squash, rebase, and history rewrites, and are queryable through
the API without a clone. `scripts/delivery-metrics.mjs` therefore reports the
agent-authored share as **labelled merged MRs / merged MRs**, and keeps the
commit-trailer share only as a secondary, known-undercounting signal.

Intervention rate — how often an agent run needed human correction — is not
derivable from git or the MR API. Record it as `n/a` until session telemetry
exists; do not substitute a proxy metric that looks like it.

## Branches

- one slice per branch, per `rules/mr-sizing.md`; short-lived by design
- name it `<type>/<slug>` or `<TICKET>-<slug>` — the ticket prefix is what
  `skills/create-pr` reads to link the tracker
- rebase the branch onto its base; never merge the base into the branch.
  Force-push with `--force-with-lease`, never bare `--force`
- projects that keep additional long-lived branches (`development`,
  `acceptance`) apply every rule above to those branches too; the base a branch
  targets is resolved, not assumed

## Never

- push to the default branch, or to any protected long-lived branch
- merge with a merge commit (`ff` makes this impossible by configuration —
  keep it that way)
- merge your own MR without the required approval, or with the pipeline red
- rewrite history on the default branch

One exception to the first two: after a hotfix has merged into the production
branch, `skills/dependency-hotfix` back-merges production into `acceptance`
and `development` as a fast-forward or two-parent merge-commit push when
`squash_option` is `always`. A squashed back-merge MR copies the change but
not the commit, so production stops being an ancestor and the next
fast-forward release fails. The push carries only the reviewed hotfix commit
and lockfile, `package.json` and changelog conflict resolution — never a new
change.

## Enforcement

| Moment | Surface | Level |
| --- | --- | --- |
| Repo kickoff or retrofit | `skills/start-project` lane 0, check 3b | **Blocking** — deviations are reported, and fixed with the script only after an explicit go |
| Opening an MR | `skills/create-pr` | **Blocking** — conventional MR title and the `ai:agent-authored` label |
| Monthly sweep | `skills/maintenance` lanes E and H | **Advisory** — settings drift as a finding; metrics as a delta |
