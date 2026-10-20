# Contributing To This Repo

Everything here reaches other people's machines automatically, so the process is
stricter than the size of most changes suggests.

## Every Change Lands Via A GitLab MR

Hard rule, not a preference: never a direct push to `main`, not even a one-line
doc fix. The same rule applies to the `upstream-rules` and `upstream-to-unicore`
skills when run from a project. The canonical wording lives in
[`shared/upstream-mr.md`](../shared/upstream-mr.md). It is injected into this
repo's `AGENTS.md`, Copilot adapter and repo-only Claude rule
(`.claude/rules/upstream-mr.md`), and into
`skills/upstream-rules/references/upstream-mr.md` for the upstream skills — but
not into the root `CLAUDE.md` or the project adapter templates, which load in
every session (of every project, and of every synced project). The root
`CLAUDE.md` carries a short pointer; the templates name the `upstream-rules`
skill.

```bash
git switch -c <type>/<slug>
git push -u <gitlab-remote> HEAD
glab mr create -R greenberrynl/config/ai-workflows \
  --target-branch main --reviewer wieteke.pots \
  --title "<type>: <summary>" --description "<body>"
```

An MR without `wieteke.pots` as reviewer is not done. Resolve the GitLab remote
by URL rather than assuming its name — the GitHub mirror is not a substitute
(these repos are reviewed on GitLab, and GitHub refuses a review request from the
PR author).

The MRs here follow the same scope rules as product work
([`rules/mr-sizing.md`](../rules/mr-sizing.md)): one reviewable change per MR,
≤ 400 authored lines, and a mechanical rename never travels with new behaviour —
it gets its own MR. Stacking is fine: target the previous branch and say so in the
description; GitLab retargets each MR as the one below it merges.

## Contributor Setup

```bash
cd ~/Web/ai-workflows
./scripts/generate-adapters.sh
./scripts/install-hooks.sh
```

`install-hooks.sh` installs two git hooks:

- **pre-commit** — runs `validate-ai-instructions.sh` as a drift check
- **pre-push** — refuses direct pushes to `main`/`master`

Those are git hooks for this repo. The plugin ships a second kind: Claude Code
hooks in [`hooks/hooks.json`](../hooks/hooks.json), which run in every session
once the plugin is enabled — here too, so this repo needs no extra setup for
them. One of them is the `Stop` hook (`scripts/improve_skill_retrospective.py`):
after a Greenberry skill ran and the user stepped in, it blocks the stop once per
session so Claude offers `skills/improve-skill`. It never runs the retrospective
itself, and its test (`scripts/test_improve_skill_retrospective.py`) runs inside
`validate-ai-instructions.sh`.

## Daily Loop

1. Edit the canonical source in this repo.
2. `./scripts/generate-adapters.sh`
3. `./scripts/validate-ai-instructions.sh`
4. Commit the source changes.
5. Re-run `./scripts/sync.sh` globally, or
   `./scripts/sync.sh --project <path>` for target repos.

Useful variants:

```bash
./scripts/sync.sh --dry-run                       # preview global sync
./scripts/sync.sh --project /path/to/project      # sync a project
```

## Where Does A Change Belong?

| The change is… | Put it in |
| --- | --- |
| project-specific stack, structure, scripts, exceptions | that project's `CONVENTIONS.md` |
| a reusable coding standard | `rules/` |
| compact universal type-safety doctrine | `shared/core-rules.md` (detailed enforcement → `rules/type-safety.md`) |
| a reusable multi-step workflow | `skills/` first |
| a Copilot-compatible wrapper or fallback procedure | `commands/` |
| tool-specific adapter wording | `templates/`, `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md` |
| a snippet repeated across adapters | `shared/` |

If a synced project changed a shared workflow file in a generally reusable way,
upstream it here instead of letting that project drift.

## Process Documentation

Three rules keep process docs trustworthy:

- **Document what is, not what should be.** A doc describes behaviour that is
  true today; aspirations go to `docs/backlog/` until they ship. A rule that
  is not true yet teaches readers to discount the rules that are.
- **Every process doc names its trigger surface** — who reads it and when (a
  skill step, a validator, an onboarding path). A doc with no honest answer
  merges into one that has one, or is deleted.
- **Empirical hard rules carry their evidence**: date observed, tool version,
  and the exact error string — so a later contradicting observation is a
  diagnosis, not a coin toss between two hard-won rules. Once the rule is
  mechanically checkable, add the check and shrink the prose to a pointer at
  it.

## Add Or Update A Command

1. Edit the runbook in `commands/`.
2. Add or update the trigger mapping in `shared/command-mappings.md`. When a
   skill row names the command as its fallback, put any new trigger in that
   skill row too; when none does, copy the command row verbatim into the
   `## Command Mapping` section of `CLAUDE.md`. The validator checks both.
3. When no skill covers the runbook, list it under `commands` in
   `.claude-plugin/plugin.json` — that is what makes it `/greenberry:<name>`. A
   runbook that shares a skill's name stays out: Claude Code would load it in
   place of the skill, and the validator rejects it.
4. Run `./scripts/generate-adapters.sh`.

## Add Or Update A Skill

1. Edit or create `skills/<name>/SKILL.md`. Keep the body under ~500 lines:
   the procedure stays inline; deep-dive reference blocks move to files inside
   the skill directory behind a conditional pointer ("when X applies, read
   `references/<topic>.md`") — the validator warns past the budget. The
   frontmatter carries `metadata:` with an indented `owner: <gitlab username>`
   line (`wieteke.pots` for every skill for now); the validator errors without
   it.
2. Add the trigger mapping in `shared/skill-mappings.md` and run
   `./scripts/generate-adapters.sh` — a skill missing from that registry cannot
   be reached by intent at all, which the validator treats as an **error**.
3. Record the canonical surface in
   [workflow-canonical-sources.md](workflow-canonical-sources.md) and add the
   inventory row in [`FEATURES.md`](../FEATURES.md).
4. Place it in the process in [pipeline-map.md](pipeline-map.md) — which phase it
   fires in, which gate it helps close, and how it is invoked.
5. Add or update the regression cases for the skill in `evals/<name>/` and run
   them: `claude plugin eval . --tag <name> --runs 1 --ablation none --no-publish
   --trust-plugin --judge-model sonnet --max-cost-usd 3`. A `description` edit
   also runs the routing suite: the same command with `--tag routing`. Layout,
   the `runnable`, `needs-scaffold` and `routing` tags, the judge choice, and
   why `--no-publish` is not optional are in
   [`evals/README.md`](../evals/README.md). Each run is a real model call on your
   account. For a one-off check no case covers yet,
   `claude -p "<prompt>" --plugin-dir .` loads this checkout's plugin over the
   installed one, so a skill change is never "only testable after the release".
6. Run `./scripts/validate-ai-instructions.sh`; steps 2–4 are checked, so a
   missing entry surfaces instead of staying invisible.
7. Republish the pipeline map so the shared copy matches the repo — see
   [how-it-works.md](how-it-works.md#the-delivery-pipeline).

## Add Or Update A Shared Fragment

1. Create or edit `shared/<name>.md`.
2. Add matching `<!-- BEGIN SHARED:<name> -->` markers where it should render.
3. Run `./scripts/generate-adapters.sh`.

## Add Or Update A Project Adapter

1. Edit the relevant file in `templates/`.
2. If the adapter should render shared content, add shared markers.
3. Re-run project sync against a test repo and confirm the generated output.

## Ship A Plugin Release

The `greenberry` plugin serves `skills/` and `commands/` straight from `main`, so
every merged MR touching them is already a release. The `version` does not
*cause* the release — it makes it visible in `/plugin`, where the install path is
version-keyed. That is why the number is assigned **after** merge, not in the MR
that changes something.

In a content MR:

1. Add one fragment file `changelog.d/<section>.<slug>.md`, where `section` is
   `added`, `changed`, `deprecated`, `removed`, `fixed` or `security` and the
   slug names the change (`changelog.d/added.service-cli.md`). Its content is
   the `- ` bullet(s) exactly as they will read under the `### <Section>`
   heading, continuation lines indented by two spaces. The word `BREAKING`
   anywhere in it makes the release a MAJOR. Several MRs can each add their
   file without ever touching the same line; `validate-skills.mjs` rejects a
   misnamed or empty fragment.
2. When developers will notice the change, give its bullet a Slack note: one
   continuation line `  <!-- slack: <Dutch one-liner> -->`, optionally
   `<!-- slack: <onderdeel> | <one-liner> -->` when the bullet does not start
   with the skill or file it changes. Only noted entries get a row in the
   release post's table; the rest are counted under it, so leave internal
   changes (validators, CI) without one. GitLab renders the comment
   invisibly. Keep it under 120 characters; `validate-skills.mjs` errors on a
   note that is not indented under its bullet.
3. When developers must *do* something once after updating (delete a file,
   re-run a skill), add a separate `changelog.d/action.<slug>.md` too. It
   lands under `### Action required` and in its own "Eenmalig" block of the
   post — full text, or its Slack note when it has one. It does not bump the
   version on its own.
4. Leave [`CHANGELOG.md`](../CHANGELOG.md) and `.claude-plugin/plugin.json`
   alone. (Entries that older MRs still wrote under `## [Unreleased]` are
   picked up by the next release too, so a half-migrated state is fine.)

The release itself is cut by CI, in the release-please pattern: one release MR
that is always current, and merging it is the release decision. The maintainer
merges it **once a week, on Monday morning**, so a week of merges reaches
developers as one version and one Slack post instead of one per merge. Only a
fix someone is waiting on (a broken skill, a hook that blocks work) goes out
the same day: merge the release MR right after that fix lands.

- **`release_train`** runs on every push to `main`. When `changelog.d/` holds
  fragments (or `## [Unreleased]` still has entries) it runs
  `scripts/assign-plugin-version.mjs --write` on the branch `release/next` —
  the fragments become the `## [x.y.z]` section, in Keep a Changelog order,
  and are deleted, and the delivered backlog items are archived (see
  [below](#the-release-archives-the-backlog)) — commits `release: x.y.z`,
  force-pushes, and opens the MR to
  `main` with the maintainer as reviewer — or updates the open MR's title and
  body when a later content merge changes what the release carries. With an
  empty `## [Unreleased]` it does nothing. So the question "do we need a
  release MR?" has a standing answer: if there is something to release, the
  MR exists, and it merges on the next Monday.
- **`announce_release`** runs on the same pushes and posts only when the merge
  changed the version in `.claude-plugin/plugin.json`, to the `#ai-workflows`
  Slack channel (its own channel, so `#development` stays free of release
  noise), as Block Kit: an overview of what to do, the update steps,
  a "Projecten syncen" block with the commands when the release changed a
  file a project sync delivers (the set `project-sync-freshness.sh` digests,
  diffed against the previous `release:` commit — hence `GIT_DEPTH 0` on this
  job), the "Eenmalig" block from `action` fragments, and one table of the
  noted changes (all entries by first sentence when none has a note). `node
  scripts/announce-release.mjs --dry-run --version x.y.z` previews it as text,
  `--json` prints the webhook payload, which [Block Kit
  Builder](https://app.slack.com/block-kit-builder) renders.
- **`publish_release`** acts on the same release merges: it tags the merge
  commit `vx.y.z` and creates the GitLab Release, whose notes are the
  `## [x.y.z]` section plus the backlog items the release archived. One call
  to the Releases API does both, on `CI_JOB_TOKEN`; a Release that already
  exists is left alone. `node scripts/publish-release.mjs --dry-run --version
  x.y.z` shows the notes.

`release_train` and `announce_release` need a CI/CD variable (Settings → CI/CD
→ Variables, masked, protected) and print what they would do while it is
missing, so the pipeline stays green. `publish_release` needs none:

| Variable | What | Used by |
| --- | --- | --- |
| `RELEASE_BOT_TOKEN` | project access token, role Developer, scopes `api` + `write_repository`; pushes `release/next` and opens the MR | `release_train` |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for `#ai-workflows` | `announce_release` |

### Setting up the two variables (once)

`RELEASE_BOT_TOKEN`:

1. Project → Settings → Access tokens → **Add new token**. Name
   `release-train`, role **Developer**, scopes **`api`** and
   **`write_repository`**, an expiry date (GitLab requires one; a year out is
   fine, `skills/maintenance` flags it when it comes near). Create, and copy
   the token now: it is shown once.
2. Project → Settings → CI/CD → Variables → **Add variable**. Key
   `RELEASE_BOT_TOKEN`, value the token, type *Variable*, environment scope
   *All*, **Protect variable** on (`main` is protected, and only the `main`
   pipeline needs it), **Mask variable** on, *Expand variable reference* off.
   Save.

`SLACK_WEBHOOK_URL`:

1. <https://api.slack.com/apps> → **Create New App** → *From scratch* → name
   `ai-workflows releases`, workspace Greenberry → Create. An existing app
   that already has incoming webhooks works too.
2. Features → **Incoming Webhooks** → switch *Activate Incoming Webhooks* on →
   **Add New Webhook to Workspace** → channel `#ai-workflows` → Allow. Copy the
   webhook URL (`https://hooks.slack.com/services/…`).
3. Optional: Settings → Basic Information → *Display Information* sets the
   name and icon the posts appear under.
4. Project → Settings → CI/CD → Variables → **Add variable**. Key
   `SLACK_WEBHOOK_URL`, value the URL, **Protect variable** on, **Mask
   variable** on (the URL's characters are within GitLab's mask set). Save.

Verify: the next push to `main` runs both jobs. The `release_train` log ends
in `Opened !<n> (release: x.y.z)`, the `announce_release` log in `Not a
release commit`. Merge that release MR, and the following `announce_release`
log ends in `Announced x.y.z in Slack`, with the post in `#ai-workflows`, and
the `publish_release` log in `Published vx.y.z`, with the Release under
Deploy → Releases. To
announce a version released before the webhook existed, run
`SLACK_WEBHOOK_URL=<url> node scripts/announce-release.mjs --version x.y.z`
from your own terminal; the URL never lands in the repo.

The bump inference lives in `scripts/assign-plugin-version.mjs`, for CI and
for the manual fallback alike: `### Removed` or a `BREAKING` marker is MAJOR
(removed/renamed skill or command, changed workflow contract), `### Added` is
MINOR (new skills or commands, notable behaviour changes), anything else is
PATCH (fixes and wording). When judgment differs from that default, cut the
release by hand in its own small MR — `node scripts/assign-plugin-version.mjs`
prints the plan, `--write` applies it (`--bump minor` or `--as 2.0.0` override
the inference); commit `CHANGELOG.md`, `.claude-plugin/plugin.json`,
`changelog.d/` and `docs/backlog/`. The
train leaves an open hand-cut MR alone as long as its branch is not
`release/next`, and goes quiet once it merges and `## [Unreleased]` is empty.

The readers behind the three jobs (`scripts/changelog-sections.mjs`), the
backlog archive (`scripts/backlog-archive.mjs`), the Slack post
(`scripts/release-announcement.mjs`) and its sync check
(`scripts/project-sync-paths.mjs`) are covered by
`scripts/test-release-automation.mjs`, which `validate-ai-instructions.sh` runs.

### The release archives the backlog

This repo has no sprints, so no sprint close archives delivered backlog items;
the release does. Every cut — by `release_train` or by hand — removes the items
in `docs/backlog/` whose `Status` is `done` or `superseded`, and the release
MR's description carries the backlog status: what it archives, what it keeps,
and what is still open. An item `in-progress` after its merge has a post-merge
check left; tick the check and set it to `done`, and the next release takes it.

- **Archive.** The tag is the anchor: `git show vx.y.z^1:docs/backlog/<file>`
  reads a removed item back, and the GitLab Release links each one at that
  commit.
- **Kept.** An item that a living doc still names — tracked Markdown outside
  `docs/backlog/`, `CHANGELOG.md` and `changelog.d/` — stays, because the
  validator's link and pipeline-map checks would fail on its removal. Drop the
  reference in a content MR and the next release archives it.
- **Dependencies.** A `Depends on:` link whose file a release removed counts as
  satisfied in `skills/work-backlog`.
- **Status.** Every item needs a readable `Status`; the test suite fails on one
  that has none, since the release could never archive it.
- `node scripts/backlog-archive.mjs` prints the status without writing.

Why not bump in the content MR: every MR would edit the same manifest line and
insert at the same changelog position. Four concurrent MRs did exactly that on
2026-08-05 — three claimed the same number, and whichever merged second both
conflicted and shipped a version already on `main`.

`./scripts/validate-ai-instructions.sh` guards the flow from both sides: it
errors when the manifest version has no changelog entry, when `## [Unreleased]`
is missing (content MRs would have nowhere to land), and when the changelog
documents a version *above* the manifest — a release written by hand that
`/plugin` will never serve.

The bump covers everything the plugin delivers, not just `skills/` and
`commands/`: `hooks/`, a script a hook runs, and the ambient layer (`CLAUDE.md`
plus the universal `rules/` subset) all reach teammates through this channel. The
install path is version-keyed, so an unbumped release lands in the previous
version's directory and is invisible in `/plugin`.

Only repo-internal changes skip the bump — `README.md`, `docs/`, `FEATURES.md`,
CI config, and templates that project sync renders rather than the plugin.

## Validation

| Script | What it covers |
| --- | --- |
| `scripts/validate-ai-instructions.sh` | full pipeline — skill validation, adapter regeneration, project-sync and ambient-sync smoke tests, generated-artifact drift |
| `scripts/validate-skills.mjs` | skill frontmatter, doc links, the canonical-sources inventory, pipeline-map entries |
| `scripts/smoke-test-project-sync.sh` | default project sync path, shared workflow assets, prompt generation alignment, `CONVENTIONS.md` present/missing behavior |
| `scripts/smoke-test-ambient-sync.sh` | the ambient layer the `SessionStart` hook delivers |

Run the project-sync smoke test before merging changes that affect project
templates or sync behavior.

## Safety

- Make edits in this repo first, then sync.
- Avoid hand-editing synced targets unless you intentionally want local drift.
- Codex system skills are never touched; sync writes only to
  `~/.codex/skills/custom`.
- Project MCP config lives in each project's `.mcp.json` (emitted by
  `setup-ai-workflows`); nothing MCP-related is written globally, so local MCP
  config is never overwritten.
- Adapter files are partially generated — edit the canonical source, not the
  content between shared markers.
- After any skill run that needed correcting, run `improve-skill` so the learning
  lands in the skill's source here instead of in your memory.
