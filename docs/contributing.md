# Contributing To This Repo

Everything here reaches other people's machines automatically, so the process is
stricter than the size of most changes suggests.

## Every Change Lands Via A GitLab MR

Hard rule, not a preference: never a direct push to `main`, not even a one-line
doc fix. The same rule applies to the `upstream-rules` and `upstream-to-unicore`
skills when run from a project. The canonical wording lives in
[`shared/upstream-mr.md`](../shared/upstream-mr.md) and is injected into every
adapter.

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

## Add Or Update A Command

1. Edit the runbook in `commands/`.
2. Add or update the trigger mapping in `shared/command-mappings.md`.
3. Run `./scripts/generate-adapters.sh`.

## Add Or Update A Skill

1. Edit or create `skills/<name>/SKILL.md`.
2. Add the trigger mapping in `shared/skill-mappings.md` and run
   `./scripts/generate-adapters.sh` — a skill missing from that registry cannot
   be reached by intent at all, which the validator treats as an **error**.
3. Record the canonical surface in
   [workflow-canonical-sources.md](workflow-canonical-sources.md) and add the
   inventory row in [`FEATURES.md`](../FEATURES.md).
4. Place it in the process in [pipeline-map.md](pipeline-map.md) — which phase it
   fires in, which gate it helps close, and how it is invoked.
5. Run `./scripts/validate-ai-instructions.sh`; steps 2–4 are checked, so a
   missing entry surfaces instead of staying invisible.
6. Republish the pipeline map so the shared copy matches the repo — see
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
every merged MR touching them is a release. Make releases visible:

1. Bump `version` in `.claude-plugin/plugin.json` **in the same MR** — MAJOR for
   breaking changes (removed/renamed skill or command, changed workflow
   contract), MINOR for new skills/commands or notable behavior changes, PATCH
   for fixes and wording.
2. Add the matching `## [x.y.z] - YYYY-MM-DD` entry to
   [`CHANGELOG.md`](../CHANGELOG.md).
3. `./scripts/validate-ai-instructions.sh` errors when the manifest version has
   no changelog entry, so pre-commit and CI both catch a missed step.

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
- Cursor MCP files are namespaced under `mcp/ai-workflows` so existing local MCP
  config is not overwritten.
- Adapter files are partially generated — edit the canonical source, not the
  content between shared markers.
- After any skill run that needed correcting, run `improve-skill` so the learning
  lands in the skill's source here instead of in your memory.
