# Start A New Project

Use this when the project has no real code yet. Two variants — pick the one that
matches, then follow the same four steps.

Already have a codebase? → [adopt-existing-project.md](adopt-existing-project.md).
Machine not set up yet? → [setup-machine.md](setup-machine.md).

## No Repo Yet

Start from the Greenberry template rather than an empty directory — it already
carries the stack conventions the rules assume.

| | |
| --- | --- |
| Template repo | [`greenberrynl/the-greenhouse/unicore-template`](https://gitlab.com/greenberrynl/the-greenhouse/unicore-template) |
| Default branch to take | confirm with the maintainer — the active line is `experimental-new-setup`, not `main` |

```bash
git clone git@gitlab.com:greenberrynl/the-greenhouse/unicore-template.git ~/Web/my-project
cd ~/Web/my-project
git remote set-url origin <the new project's own remote>
```

Then continue with [the four steps](#the-four-steps).

Not using the template (a spike, a non-Next.js service)? Create the repo, commit
something, and continue with the same steps — `init-project` detects a generic
stack and says so in `CONVENTIONS.md`.

## Repo Exists

A fresh repo, or a template clone somebody already made for you: nothing to
migrate, no existing AI instructions to reconcile. Go straight to the four steps.

Check one thing first — if the repo already has a `CLAUDE.md`, `AGENTS.md`, or
`.github/copilot-instructions.md` with real content in it, you are on the
existing-project path instead: [adopt-existing-project.md](adopt-existing-project.md).

## The Four Steps

### 1. Capture intent — `start-project`

Open the project in Claude, Cursor, or Codex and ask for the `start-project`
workflow (Claude: `/greenberry:start-project`).

It interviews you in short rounds and writes three tracked documents:

| Document | Answers |
| --- | --- |
| `docs/project-brief.md` | why the product exists, for whom, what success looks like |
| `docs/project-spec.md` | what this release does: rules, domain, non-functionals, integrations |
| `docs/architecture.md` | system context, runtime paths, intended layer mapping, data model, trust boundaries, deployment, decisions + rationale |

On a fresh project everything comes from the interview, so budget real time for
it. This is the one step that cannot be derived from the code later.

### 2. Capture detected facts — `init-project`

Then ask for the `init-project` workflow (Claude: `/greenberry:init-project`),
naming `~/Web/ai-workflows` as the canonical source:

> Initialize this project with the `init-project` workflow. Use
> `~/Web/ai-workflows` as the canonical source.

It detects the stack and structure and writes `CONVENTIONS.md` — the
project-owned source of truth for scripts, structure, conventions, and
intentional deviations from the shared baseline. It hands off to `start-project`
first if the three documents above are missing.

Why the split matters: `docs/architecture.md` owns *intent and rationale*,
`CONVENTIONS.md` owns *what is true today*. Each fact has exactly one home, and
`CONVENTIONS.md` links to the architecture doc for the why instead of copying it.

### 3. Sync the shared assets

Run from the `ai-workflows` checkout — the target directory must already exist.
Preview first:

```bash
cd ~/Web/ai-workflows
./scripts/sync.sh --dry-run --project ~/Web/my-project
./scripts/sync.sh --project ~/Web/my-project
```

This installs or refreshes:

- `AI-WORKFLOWS.md` — developer guide for how the setup works per tool
- `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/conventions.mdc` — thin adapters that
  point back to project context
- `.github/copilot-instructions.md` — Copilot adapter, with context **inlined**
  because Copilot cannot follow references
- `.github/prompts/*.prompt.md` — Copilot prompt wrappers generated from `commands/`
- `rules/` and `commands/` — shared baseline rules and reusable runbooks
- `.cursor/rules/graphify.mdc` and `.claude/settings.json` — graphify rule and
  hooks, both guarded; settings only written when the project has none

`CONVENTIONS.md` is preserved — sync never overwrites it.

A fresh project gets `.claude/settings.json` automatically, which is what gives
teammates the one-time plugin install prompt when they open the project. (A
project that already has one is never overwritten — see
[adopt-existing-project.md](adopt-existing-project.md#merge-claudesettingsjson-by-hand).)

### 4. Review and commit

In the target project:

1. `git status --short` and review the generated changes.
2. Confirm `CONVENTIONS.md` describes the project accurately.
3. Run the project's normal validation commands.
4. Commit via the project's normal git workflow.

Put project-specific changes in `CONVENTIONS.md`. Treat the other synced files as
generated assets — a later sync can overwrite them. Reusable workflow changes go
into this repo first, then re-sync (see [contributing.md](contributing.md)).

## Next

- Keeping it current afterwards → [keep-current.md](keep-current.md)
- Why the surfaces are split the way they are → [how-it-works.md](how-it-works.md)
