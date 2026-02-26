# ai-workflows

Shared AI workflow configuration for your local IDE agents.

This repo is the **single source of truth** for:

- reusable command prompts
- reusable rules
- custom skills
- MCP server definitions
- one sync script to deploy everything into local IDE folders

## Repository Structure

- `shared/` - canonical fragments shared across adapter files
  - `command-mappings.md` - intent-to-runbook mapping list
  - `safety.md` - safety rules
- `commands/` - command prompt runbooks (Cursor, Copilot, Claude, Roo)
- `rules/` - focused rule files split by concern (communication, project, tailwind, testing, accessibility, clean-architecture)
  - `stacks/` - stack-specific conventions (nextjs-payload, react-native-expo)
- `skills/` - custom skills for Cursor and Codex
- `mcp/` - canonical MCP server definitions
- `AGENTS.md` - canonical policy (auto-injected from `shared/`)
- `CLAUDE.md` - Claude Code CLI adapter (auto-injected from `shared/`)
- `.github/copilot-instructions.md` - GitHub Copilot adapter (auto-injected from `shared/`)
- `.vscode/tasks.json` - VS Code tasks (auto-generated from `shared/`)
- `scripts/generate-adapters.sh` - injects shared fragments into adapter files
- `scripts/validate-ai-instructions.sh` - runs generation and checks for drift
- `scripts/sync.sh` - deploys this repo into local config folders
- `scripts/install-hooks.sh` - installs git pre-commit hook for drift validation

## AI Behavior

Use a single-source + adapters model.

- Shared fragments: `shared/*.md`
- Canonical policy: `AGENTS.md`
- Baseline defaults: `rules/rules.md` (index), `rules/*.md` (focused files)
- Operational runbooks: `commands/*.md`
- GitHub Copilot adapter: `.github/copilot-instructions.md`
- Claude Code CLI adapter: `CLAUDE.md`
- VS Code runnable entries: `.vscode/tasks.json`

### Add A New Command Mapping

1. Add or update the runbook in `commands/`.
2. Add the mapping to `shared/command-mappings.md`.
3. Run `./scripts/generate-adapters.sh`.

That's it. The script injects the mapping into all adapter files and
regenerates `.vscode/tasks.json` automatically.

### Add A New Shared Fragment

1. Create `shared/<name>.md` with the canonical content.
2. Add `<!-- BEGIN SHARED:<name> -->` / `<!-- END SHARED:<name> -->` markers
   in each adapter file where the content should appear.
3. Run `./scripts/generate-adapters.sh`.

## How Sync Works

Run:

```bash
./scripts/sync.sh
```

The script syncs from this repo to:

- `~/.cursor/commands`
- `~/.roo/rules-code`
- `~/.roo/commands`
- `~/.cursor/skills-cursor/ai-workflows`
- `~/.cursor/mcp/ai-workflows`
- `~/.codex/skills/custom`
- `~/.claude/CLAUDE.md`

It uses `rsync -av --delete`, so the target folders become an exact mirror of
this repo's source folders.

```bash
# sync everything
./scripts/sync.sh

# preview changes without writing
./scripts/sync.sh --dry-run
```

## Safety Rules

- Codex system skills are not touched.
  - The script only writes to `~/.codex/skills/custom`.
  - It does **not** modify `~/.codex/skills/.system`.
- Cursor skills are written to `skills-cursor/ai-workflows` only.
  - This avoids deleting or replacing existing non-managed skills in
    `skills-cursor/`.
- MCP definitions are written to `mcp/ai-workflows` only.
  - This avoids overwriting an existing `~/.cursor/mcp.json`.
- If a target product folder does not exist on a device, that target is
  skipped.

## First-Time Setup On A New Device

1. Clone repo:

```bash
git clone git@github.com:wpots/ai-workflows.git ~/Web/ai-workflows
cd ~/Web/ai-workflows
```

2. Generate adapter files:

```bash
./scripts/generate-adapters.sh
```

3. Sync into local IDE folders:

```bash
./scripts/sync.sh
```

4. Install pre-commit hook (optional):

```bash
./scripts/install-hooks.sh
```

5. Optional convenience alias:

```bash
echo 'alias ai-sync="$HOME/Web/ai-workflows/scripts/sync.sh"' >> ~/.zshrc
source ~/.zshrc
```

## Daily Workflow

1. Edit shared fragments or runbooks in this repo.
2. Run `./scripts/generate-adapters.sh` (or let the pre-commit hook do it).
3. Commit + push.
4. On each device: `git pull && ./scripts/sync.sh`.

## Typical Commands

```bash
# generate adapter files from shared sources
./scripts/generate-adapters.sh

# validate no drift
./scripts/validate-ai-instructions.sh

# deploy to local IDE folders
./scripts/sync.sh
```

## Notes

- Because sync uses `--delete`, avoid manual edits in synced target folders
  (`~/.cursor/...`, `~/.roo/...`, etc.).
- Make all edits in this repo, then sync.
- Adapter files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`,
  `.vscode/tasks.json`) are partially generated — edit the `shared/` sources,
  not the content between `<!-- BEGIN SHARED -->` / `<!-- END SHARED -->` markers.
