# Keep A Project And Machine Current

For projects already on ai-workflows. Two things drift independently: the assets
on **your machine** and the assets **committed in each project**.

## Your Machine

| Tool | How updates arrive | What you do |
| --- | --- | --- |
| Claude Code | `greenberry` plugin auto-update (SSH only) + the `SessionStart` ambient hook | Nothing, normally. Claude prompts to reload when something new landed. |
| Cursor, Codex | `./scripts/sync.sh` only | Pull and re-sync when you want the update. |
| Copilot | project-committed `.github/copilot-instructions.md` | Nothing on the machine — it updates per project. |

Cursor/Codex refresh:

```bash
cd ~/Web/ai-workflows
git checkout main && git pull --ff-only
./scripts/sync.sh
```

Claude users only need that by hand in two cases: the plugin is stale and you
want the ambient layer now anyway, or you are testing a local change before it
merges. Running sync always applies, regardless of the hook's digest stamp.

Verify a Claude install is actually current: `/plugin` should show `greenberry`
tracking `main`, not the commit you installed at. If it lags, that is nearly
always a missing `"autoUpdate": true` →
[troubleshooting.md](troubleshooting.md).

Forcing a refresh after a merge you are waiting on:

```
/plugin marketplace update ai-workflows
/reload-plugins
```

## A Project

```bash
cd ~/Web/ai-workflows
git pull --ff-only
./scripts/sync.sh --dry-run --project ~/Web/my-project
./scripts/sync.sh --project ~/Web/my-project
```

Then in the project: `git status --short`, run the validation commands, commit.

What a re-sync overwrites — expect these to change, and never hand-edit them in
the project:

- `AI-WORKFLOWS.md`
- `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/conventions.mdc`
- `.github/copilot-instructions.md`, `.github/prompts/`
- `rules/`, `commands/`

What survives:

- `CONVENTIONS.md` — project-owned
- `.claude/settings.json` — preserved when it already exists
- `docs/project-brief.md`, `docs/project-spec.md`, `docs/architecture.md`
- everything else in the project

## When To Re-Sync A Project

There is no schedule that needs enforcing, but these are the useful triggers:

| Trigger | Why |
| --- | --- |
| A rule or command you rely on changed here | Cursor/Codex/Copilot read the project copy, not this repo. |
| The project's stack changed (major upgrade, new CMS, new test runner) | `CONVENTIONS.md` is now wrong — re-run `setup-ai-workflows`, not just sync. |
| Onboarding someone new to the project | Cheapest moment to fix drift. |
| A periodic maintenance sweep | The `maintenance` skill checks doc drift among other things. |

Claude-only projects can go a long time without a re-sync, since skills and
commands come from the plugin. The project copies still matter for everyone else
on the team.

## Drift In The Other Direction

If the project has changed a shared workflow file in a way other projects would
want, upstream it instead of leaving it local:

- `upstream-rules` — rules, skills, prompts, adapters, generic conventions → an
  MR on this repo
- `upstream-to-unicore` — reusable project scaffolding → an MR on
  `unicore-template`

Both open a GitLab MR with a reviewer; see [contributing.md](contributing.md).
