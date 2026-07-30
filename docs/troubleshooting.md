# Troubleshooting

## Plugin And Marketplace (Claude Code)

| Symptom | Fix |
| ------- | --- |
| `Permission denied (publickey)` on marketplace add | No SSH key for gitlab.com — see [setup-machine.md](setup-machine.md#1-check-gitlab-access). |
| `invalid url` on startup or marketplace add | Hand-written `extraKnownMarketplaces` with `"source": "url"`. Change it to `"source": "git"` — see [setup-machine.md](setup-machine.md#3-turn-on-auto-update--plugin-marketplace-add-does-not). |
| Skills show up twice | Old copies still in `~/.claude/skills` — run `./scripts/sync.sh` again. |
| A merged skill change is not visible yet | `/plugin marketplace update ai-workflows`, then `/reload-plugins`. |
| A session started with a note about `autoUpdate` or a stale plugin cache | The ambient-layer hook's freshness check — the install is pinned or auto-update is failing quietly. Fix it per [setup-machine.md](setup-machine.md#3-turn-on-auto-update--plugin-marketplace-add-does-not); the note repeats at most once a day, so silence afterwards is not proof it worked (`/plugin` is). |
| The installed plugin lags `main` by many commits | Almost always a missing `"autoUpdate": true` on the marketplace entry in `~/.claude/settings.json` — `/plugin marketplace add` does not set it. Otherwise check the marketplace was added over SSH; HTTPS installs never auto-update. Until fixed, the ambient-layer hook is pinned to that stale version; `./scripts/sync.sh` overrides it in the meantime. |
| `/greenberry:` shows nothing | Plugin not enabled — check `/plugin`, and `enabledPlugins` in the project's `.claude/settings.json`. |

## Ambient Layer (`~/.claude/CLAUDE.md` And Rules)

| Symptom | Fix |
| ------- | --- |
| Rules look out of date and no hook message appeared | The hook is digest-gated: identical content is a silent no-op. If the content really should differ, the plugin is stale — see the row above, or run `./scripts/sync.sh` to apply immediately. |
| A local edit to `~/.claude/CLAUDE.md` keeps surviving | Expected. Local edits persist until the plugin delivers *different* content, because the gate hashes the source, not the target. Run `./scripts/sync.sh` to force the repo version back. |
| A merged ambient change never arrives | The MR likely skipped the `plugin.json` version bump, so it landed in the previous version's cache directory. Check `/plugin`, then see [contributing.md](contributing.md#ship-a-plugin-release). |

## Project Sync

| Symptom | Fix |
| ------- | --- |
| `Error: directory does not exist` | `--project` needs an existing path; create/clone the project first. |
| Sync wiped a hand-edit in `CLAUDE.md`, `AGENTS.md`, or `rules/` | Those are generated per project. Move the content to `CONVENTIONS.md` (project-specific) or upstream it here (reusable) — see [adopt-existing-project.md](adopt-existing-project.md#step-0--rescue-what-your-old-instructions-knew). |
| `CONVENTIONS.md` describes the project wrongly after a stack change | Re-run `setup-ai-workflows` rather than sync; sync never touches that file. |
| Teammates get no plugin install prompt | The project's `.claude/settings.json` predates sync and was preserved — merge the keys by hand, see [adopt-existing-project.md](adopt-existing-project.md#merge-claudesettingsjson-by-hand). |
| Copilot ignores a rule that Claude follows | Only `.github/copilot-instructions.md` is ambient for Copilot. Inline what matters, or point Copilot at the prompt/runbook — see [how-it-works.md](how-it-works.md#tools-do-not-load-instructions-the-same-way). |

## Git And GitLab CLI

| Symptom | Fix |
| ------- | --- |
| `glab` reports `invalid_grant` and `git push` fails with `could not read Username` | The glab OAuth token broke and git-HTTPS auth runs through glab. Re-authenticate with `glab auth login` using a **Personal Access Token** (scopes `api` + `write_repository`) — PATs have no refresh races. |
| `Refusing to push directly to main` | Working as intended (pre-push hook). Branch, push, and open an MR — see [contributing.md](contributing.md). |
| Pre-commit fails on generated-artifact drift | Run `./scripts/generate-adapters.sh` and commit the regenerated files. |
