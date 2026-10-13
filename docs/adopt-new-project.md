# Start A New Project

Use this when the project has no real code yet. One workflow drives it —
`start-project` — and this page covers the parts around it that only a person can
do.

Already have a codebase? → [adopt-existing-project.md](adopt-existing-project.md).
Machine not set up yet? → [setup-machine.md](setup-machine.md).

## No Repo Yet

A production repo is created through GitLab's **Create from template** flow, from
the `Project templates` group into the **client's group** — for example
`greenberrynl/amsterdam-en-partners/iamsterdam-website`. The click-path with
screenshots lives in Notion:
[Nieuw Gitlab Project](https://app.notion.com/p/0682fe5062b84b5d9f5e5c1e049d06f7).

Two things that follow from it:

- It is a UI flow. Creating the project from the CLI gives you an empty repo
  without the template, so do not shortcut it.
- If the client has no group yet, create the group first.

Then clone your new project (not the template) and continue below.

**A PoC or spike may skip all of that** — start from an empty repo if that is
faster. `start-project` will ask whether this is production or a PoC, and records
the waiver in `docs/project-brief.md` plus the decision log, so the shortcut stays
visible instead of quietly becoming a production project.

## Repo Exists

A fresh repo, or a template clone somebody already made for you: nothing to
migrate, no existing AI instructions to reconcile.

Check one thing first — if the repo already has a `CLAUDE.md`, `AGENTS.md`, or
`.github/copilot-instructions.md` with real content in it, you are on the
existing-project path instead: [adopt-existing-project.md](adopt-existing-project.md).

## One Workflow: `start-project`

Open the project in Claude or Codex and ask for the `start-project`
workflow (Claude: `/greenberry:start-project`). It runs six lanes in order and
stops for you where a person is needed.

| Lane | What it does | What it leaves behind |
| --- | --- | --- |
| 0 · Repository | checks the repo against the template method above: namespace, template lineage, default branch and merge settings, protected branches, approval rules, CI/CD variable names, Jira and Slack integrations | a pass/deviation/unknown table; proposed fixes; a recorded PoC waiver when that applies |
| 1 · Config | runs `setup-ai-workflows` when the project has no (or a stale) `CONVENTIONS.md` | `CONVENTIONS.md` + the tool adapters |
| 2 · Resources | asks for design and service resources **before** writing anything | Figma/prototype links, CMS instance, tracker key, hosting, integrations with their credential owners, test accounts |
| 3 · Intent | interviews you in short rounds | `docs/project-brief.md`, `docs/project-spec.md`, `docs/architecture.md` |
| 4 · Journeys | hands off to `user-journeys` | one document per journey in `docs/journeys/`, each ending in slice candidates |
| 5 · Plan | hands off to `backlog` and `jira-ticket` | backlog items sized to one MR each, per `rules/mr-sizing.md` |

Have these ready before you start, or lane 2 will park them as open questions:
the client group, the Figma links, the tracker key, the CMS instance, and who
owns which credential.

Two things worth knowing about the split:

- `docs/architecture.md` owns *intent and rationale*; `CONVENTIONS.md` owns *what
  is true today*. Each fact has exactly one home, and `CONVENTIONS.md` links to
  the architecture doc for the why instead of copying it.
- On a fresh clone, lane 1 runs before the architecture doc exists, so it detects
  the layer mapping itself. After lane 3, `start-project` offers to refresh
  `CONVENTIONS.md` so it links the intended mapping instead of a second copy.

`setup-ai-workflows` also runs on its own, any time you want the config
regenerated (Claude: `/greenberry:setup-ai-workflows`):

> Set up this project with the `setup-ai-workflows` workflow. Use
> `~/Web/ai-workflows` as the canonical source.

## Sync The Shared Assets

Claude Code gets skills and commands from the `greenberry` plugin, so this step is
for **Codex**, and for the generated project adapters. Run it from the
`ai-workflows` checkout — the target directory must already exist. Preview first:

```bash
cd ~/Web/ai-workflows
./scripts/sync.sh --dry-run --project ~/Web/my-project
./scripts/sync.sh --project ~/Web/my-project
```

This installs or refreshes:

- `AI-WORKFLOWS.md` — developer guide for how the setup works per tool
- `CLAUDE.md`, `AGENTS.md` — thin adapters that point back to project context
- `.github/copilot-instructions.md` — Copilot adapter, with context **inlined**
  because Copilot cannot follow references
- `.github/prompts/*.prompt.md` — Copilot prompt wrappers generated from `commands/`
- `rules/` and `commands/` — shared baseline rules and reusable runbooks
- `.claude/settings.json` — graphify hooks, only written when the project has
  none

`CONVENTIONS.md` is preserved — sync never overwrites it.

A fresh project gets `.claude/settings.json` automatically, which is what gives
teammates the one-time plugin install prompt when they open the project. (A
project that already has one is never overwritten — see
[adopt-existing-project.md](adopt-existing-project.md#merge-claudesettingsjson-by-hand).)

## Review And Commit

In the target project:

1. `git status --short` and review the generated changes.
2. Confirm `CONVENTIONS.md` describes the project accurately.
3. Read the lane 0 table again and resolve what it flagged — repo settings,
   missing integrations, hosting or CMS contracts.
4. Run the project's normal validation commands.
5. Commit via the project's normal git workflow. The brief, spec, architecture
   doc, and journeys are tracked: an untracked decision is a lost one.

Put project-specific changes in `CONVENTIONS.md`. Treat the other synced files as
generated assets — a later sync can overwrite them. Reusable workflow changes go
into this repo first, then re-sync (see [contributing.md](contributing.md)).

## Next

- Keeping it current afterwards → [keep-current.md](keep-current.md)
- Why the surfaces are split the way they are → [how-it-works.md](how-it-works.md)
