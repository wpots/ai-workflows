# Adopt In An Existing Project

Use this when the project already has code — and usually already has *some* AI
setup: a hand-written `CLAUDE.md`, Copilot instructions someone wrote a year
ago, or nothing but a long README that agents keep missing.

This is the most common starting point, and the retrofit is cheaper than it
looks: the repo already answers half the questions a new project has to answer by
interview.

Project already on ai-workflows and you just want it up to date? →
[keep-current.md](keep-current.md).

## What Happens To The Files You Already Have

Know this before you run anything.

| File | What adoption does |
| --- | --- |
| `CONVENTIONS.md` | Created if missing. **Never overwritten** by sync — it is project-owned. |
| `CLAUDE.md`, `AGENTS.md` | Regenerated as thin adapters. Existing content is **replaced** — `setup-ai-workflows` asks first. |
| `.cursor/rules/*` | Left alone. Cursor is not supported, so sync generates nothing for it, and files already there stay as they are. |
| `.github/copilot-instructions.md` | Left alone. Copilot is not supported, so sync generates nothing for it, and a file already there stays as it is. |
| `.claude/settings.json` | **Preserved** if present — nothing is merged for you. See [below](#merge-claudesettingsjson-by-hand). |
| `.claude/skills/verify/SKILL.md` | Created if missing, **never overwritten** — project-owned. Claude Code runs it before each commit. |
| `.gitignore` | Gets one `.playwright-mcp/` line appended when nothing ignores that folder yet; your other lines are left alone. |
| `rules/`, `commands/` | Shared baseline written in. Treat as generated from then on. |
| Anything else | Untouched. |

So the one thing to do first is rescue the content that matters.

## Step 0 — Rescue What Your Old Instructions Knew

Read your existing AI files and sort every statement into its new home. Do this
before  regenerates the adapters, or you lose the good parts.

| Something your old file said | New home |
| --- | --- |
| "we run `npm run type-check`, not `tsc`", folder layout, stack versions | `CONVENTIONS.md` (or let `setup-ai-workflows` detect it) |
| "never fetch in a page component", coding patterns | project-local `rules/`, or the shared baseline if it is generally true |
| "this repo deviates from the standard because …" | `CONVENTIONS.md` → *Deviations* |
| why the architecture is shaped this way, layer intent, trust boundaries | `docs/architecture.md` (from `start-project`) |
| product rules, domain vocabulary, who the users are | `docs/project-brief.md` / `docs/project-spec.md` |
| generic coding standards that any Greenberry project would want | upstream them into this repo instead — see [contributing.md](contributing.md) |

If you would rather keep the originals around while you work:
`git mv CLAUDE.md docs/legacy-ai-instructions.md`, then delete it once
`CONVENTIONS.md` covers everything.

## Step 1 — Retrofit The Intent Docs (Optional But Recommended)

Skip only if `docs/project-brief.md`, `docs/project-spec.md`, and
`docs/architecture.md` already exist.

Ask for the `start-project` workflow (Claude: `/greenberry:start-project`). In
retrofit mode it *harvests before asking* — README, `package.json`, `src/` layout,
env schema, migrations, CI config, `git log` on config files — and presents a
confirm-or-correct list instead of a questionnaire. You correct a handful of
lines rather than answering twenty questions.

It detects retrofit mode itself and states the mode back to you in one line
before continuing. It never overwrites an existing document without asking.

`start-project` runs six lanes plus a first run, and on a retrofit it says which
it skips and why.
Two of them do work you would otherwise do by hand here:

- **Lane 0 · Repository** checks the repo against the Greenberry template method —
  namespace, template lineage, protected branches, approval rules, CI/CD variable
  names, Jira and Slack integrations. On an inherited project this is usually
  where the surprises are. Nothing is changed without your go.
- **Lane 1 · Config** is Step 2 below. Let the workflow run it, or run it
  separately — same result.

Lane 4 writes `docs/journeys/` from the spec and the designs, and it is also
callable on its own later (`/greenberry:user-journeys`) — an existing project
usually has journeys nobody ever wrote down.

Worth the time even on an old project: it is the only place where *why* gets
written down, and the architecture doc is what makes later reviews
(`architecture-review`) able to distinguish a deliberate exception from drift.

## Step 2 — Generate The Project Context

Ask for the `setup-ai-workflows` workflow (Claude: `/greenberry:setup-ai-workflows`) — or let `start-project` run it as its config lane:

> Set up this project with the `setup-ai-workflows` workflow.

On Claude Code the skill reads the rules and templates from the plugin, so no
local clone of this repo is needed.

On an existing codebase it:

1. Confirms the target and asks before overwriting `CONVENTIONS.md`, `CLAUDE.md`,
   or `AGENTS.md`.
2. Detects the stack (Next.js, Next.js + Payload, React Native + Expo, or
   generic), test runner, and linting.
3. Probes the real folder structure rather than assuming canonical names.
4. **Detects deviations from the global rules** — including type-safety and
   trust-boundary posture — and records them explicitly instead of silently
   conforming.
5. Writes `CONVENTIONS.md` with the precedence order spelled out.

Step 4 is the one that matters on a retrofit. An existing project *will* deviate;
the point is that the deviations become visible and intentional instead of
turning every future review into an argument.

Our projects differ: one is a TypeScript Next.js site that matches the baseline,
another is a JavaScript project that stays JavaScript, a third is halfway
through a move to TypeScript. The global rules assume the first. So the skill
asks for each deviation which of two it is, and `CONVENTIONS.md` records it:

- **accepted** — the project stays this way, with the reason. New code follows
  the project, not the baseline.
- **migrating** — the project is moving to a target. New code follows the
  target; existing code follows when a file is touched or through backlog
  items.

```markdown
- JavaScript, no TypeScript — **migrating** to TypeScript (strict): new files
  are `.ts`/`.tsx`; existing `.js` converts when a file is touched.
  Why: `docs/architecture.md`, decision log
```

Without that status an agent cannot tell whether to copy the file next to it or
write toward the target. The decision itself, and why, goes in the decision log
of `docs/architecture.md` when the project has one; `CONVENTIONS.md` carries the
working rule and links there.

## Step 3 — Preview And Apply The Sync

On Claude Code, step 2 already wrote the shared files. Run the script from an
`ai-workflows` checkout when you use Codex, or when you want the `--dry-run`
preview of every file that changes:

```bash
cd ~/Web/ai-workflows
./scripts/sync.sh --dry-run --project ~/Web/my-project
```

Review the preview properly here — this is exactly the case the dry run exists
for, because the project already contains agent instructions and possibly its own
`rules/` or `commands/` directories. Then:

```bash
./scripts/sync.sh --project ~/Web/my-project
```

See [adopt-new-project.md](adopt-new-project.md#3-sync-the-shared-assets) for the
full list of what lands.

### Merge `.claude/settings.json` by hand

Project sync never overwrites an existing `.claude/settings.json`. Merge these
keys in manually — teammates opening the project then get a one-time install
prompt for the plugin:

```json
"extraKnownMarketplaces": {
  "ai-workflows": {
    "source": {
      "source": "git",
      "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git"
    },
    "autoUpdate": true
  }
},
"enabledPlugins": {
  "greenberry@ai-workflows": true
}
```

The inner `"source": "git"` is load-bearing — see
[setup-machine.md](setup-machine.md#3-turn-on-auto-update--plugin-marketplace-add-does-not)
for why `"source": "url"` fails with `invalid url`.

Merge the generated graphify hooks the same way if this project should use them.

On a pnpm project (`pnpm-lock.yaml`), also merge the four `Bash(pnpm …)` rules
from `permissions.allow` in `templates/project-claude-settings.json`. Without
them every `pnpm run` and `pnpm exec` stops on a permission prompt.

## Step 4 — Review And Commit

1. `git status --short` and review every generated change.
2. Read `CONVENTIONS.md` end to end — on a retrofit this is where detection gets
   things subtly wrong, and it is the file everything else trusts.
3. Delete the legacy instruction files once their content has a new home.
4. Run the project's validation commands.
5. Commit via the project's normal git workflow.

## Precedence, Once Adopted

Project-local conventions always win over the shared baseline:

1. project-local `CLAUDE.md` / `AGENTS.md` and `CONVENTIONS.md`
2. project-local `rules/`
3. the shared baseline from this repo

If the project changes a shared workflow file in a generally reusable way,
upstream it back into this repo rather than letting the project drift — the
`upstream-rules` skill does the MR for you.

## Next

- Staying current → [keep-current.md](keep-current.md)
- The loading model per tool → [how-it-works.md](how-it-works.md)
- Something wrong → [troubleshooting.md](troubleshooting.md)
