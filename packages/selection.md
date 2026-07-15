# Package Selection

Use packages as opt-in composition units for project sync or project
bootstrapping.

## Goals

- Keep the repository tool-agnostic across Codex, Cursor, Claude Code, and
  GitHub Copilot.
- Make Greenberry defaults portable to GitLab as `greenberry/ai-workflows`.
- Allow projects to choose stack and concern overlays without forking the
  baseline.
- Keep local exceptions in `CONVENTIONS.md`.

## Composition Order

Apply packages in this order:

1. `greenberry-base`
2. domain or delivery layer package such as `frontend`
3. framework package such as `nextjs`
4. platform package such as `payload`
5. concern packages such as `accessibility` and `testing`
6. project-local `CONVENTIONS.md`

Later layers may narrow or extend earlier defaults, but should not rewrite the
canonical shared workflow sources unless the package is explicitly providing an
overlay.

## Package Boundaries

- `greenberry-base`: default Greenberry baseline, naming, repo expectations,
  and references to shared workflow surfaces
- `frontend`: UI-oriented defaults that are framework-neutral
- `nextjs`: Next.js conventions and references to stack-specific rules
- `payload`: Payload CMS conventions and content-model guidance
- `accessibility`: explicit a11y requirements, review prompts, or focused
  overlays
- `testing`: stronger testing defaults, review prompts, or focused overlays

## Project Manifest (`.ai-workflows.yaml`)

Package selection is enforced by `scripts/sync.sh --project`. A project opts in
by adding `.ai-workflows.yaml` to its root:

```yaml
packages:
  - greenberry-base
  - frontend
  - nextjs
  - accessibility
  - testing
```

Behavior:

- `requires:` dependencies of the selected packages are resolved transitively
  (every package pulls in `greenberry-base`).
- Only the `includes.rules` and `includes.commands` of the selected packages are
  synced; files belonging to deselected packages are **removed** from the
  project, and `.github/prompts/` regenerates from the remaining commands.
- Lines referencing deselected rules files are filtered out of the generated
  adapters (`CLAUDE.md`, `AGENTS.md`, `AI-WORKFLOWS.md`,
  `.github/copilot-instructions.md`), so adapters never point at rules that are
  not present.
- Experimental files still require `--include-experimental`, even when a
  selected package lists them.
- **No manifest = legacy mode**: everything syncs, exactly as before. Existing
  projects keep working until they add a manifest.

The drift check (`check-ai-workflows-sync.sh` in synced projects) re-runs this
same script, so CI automatically guards the selected subset once a manifest is
committed.

## Project Rule

If a project needs a deviation that is not broadly reusable, keep it in
`CONVENTIONS.md` instead of editing a shared package.
