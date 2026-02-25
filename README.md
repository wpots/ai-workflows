# ai-workflows

Shared AI workflow configuration for your local IDE agents.

This repo is the **single source of truth** for:

- reusable command prompts
- reusable rules
- custom skills
- MCP server definitions
- one sync script to deploy everything into local IDE folders

## Repository Structure

- `commands/` - command prompt runbooks (Cursor, Copilot, Claude, Roo)
- `rules/` - focused rule files split by concern (communication, project, tailwind, testing, accessibility)
- `skills/` - custom skills for Cursor and Codex
- `CLAUDE.md` - Claude Code CLI adapter
- `mcp/` - canonical MCP server definitions
- `scripts/sync.sh` - deploys this repo into local config folders
- `scripts/validate-ai-instructions.sh` - checks all adapter files for drift
- `scripts/install-hooks.sh` - installs git pre-commit hook for drift validation

## AI Behavior

Use a single-source + adapters model.

- Canonical policy: `AGENTS.md`
- Baseline defaults: `rules/rules.md` (index), `rules/*.md` (focused files)
- Operational runbooks: `commands/*.md`
- GitHub Copilot adapter: `.github/copilot-instructions.md`
- Claude Code CLI adapter: `CLAUDE.md`
- VS Code runnable entries: `.vscode/tasks.json`
- Drift validation: `scripts/validate-ai-instructions.sh`

### Add A New Command Mapping

1. Add or update the runbook in `commands/`.
2. Add intent mapping in `AGENTS.md`.
3. Mirror the mapping in `.github/copilot-instructions.md`.
4. Mirror the mapping in `CLAUDE.md`.
5. Add or update a task in `.vscode/tasks.json`.
6. Run `./scripts/validate-ai-instructions.sh`.

## How Sync Works

Run:

```bash
./scripts/sync.sh
```

The script syncs from this repo to:

- `~/.cursor/commands`
- `~/.cursor-business/commands`
- `~/.roo/rules-code`
- `~/.roo/commands`
- `~/.cursor/skills-cursor/ai-workflows`
- `~/.cursor-business/skills-cursor/ai-workflows`
- `~/.cursor/mcp/ai-workflows`
- `~/.cursor-business/mcp/ai-workflows`
- `~/.codex/skills/custom`
- `~/.claude/CLAUDE.md`

It uses `rsync -av --delete`, so the target folders become an exact mirror of
this repo's source folders.

### Profiles

- `all` (default): sync personal + work targets
- `personal`: sync `~/.cursor`, `~/.roo`, `~/.codex`
- `work`: sync `~/.cursor-business` only

Examples:

```bash
# sync everything
./scripts/sync.sh

# only personal environments
./scripts/sync.sh --profile personal

# only work environment
./scripts/sync.sh --profile work

# preview changes without writing
./scripts/sync.sh --profile all --dry-run
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

2. Sync into local IDE folders:

```bash
./scripts/sync.sh
```

3. Optional convenience alias:

```bash
echo 'alias ai-sync="$HOME/Web/ai-workflows/scripts/sync.sh"' >> ~/.zshrc
source ~/.zshrc
```

## Daily Workflow

1. Edit files in this repo only.
2. Commit + push.
3. On each device: `git pull && ./scripts/sync.sh`.

## Typical Commands

```bash
# check changes
git status

# commit workflow updates
git add .
git commit -m "Update commands and rules"
git push

# deploy to local IDE folders
./scripts/sync.sh
```

## Notes

- Because sync uses `--delete`, avoid manual edits in synced target folders
  (`~/.cursor/...`, `~/.roo/...`, etc.).
- Make all edits in this repo, then sync.
