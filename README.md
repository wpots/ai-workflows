# ai-workflows

Shared AI workflow configuration for your local IDE agents.

This repo is the **single source of truth** for:

- reusable command prompts
- reusable rules
- custom skills
- one sync script to deploy everything into local IDE folders

## Repository Structure

- `commands/` - command prompt files used by Cursor profiles
- `rules/` - shared rule files (currently synced to Roo)
- `skills/` - your custom skills
- `scripts/sync.sh` - deploys this repo into local config folders

## How Sync Works

Run:

```bash
./scripts/sync.sh
```

The script syncs from this repo to:

- `~/.cursor/commands`
- `~/.cursor-business/commands`
- `~/.roo/rules-code`
- `~/.codex/skills/custom`

It uses `rsync -av --delete`, so the target folders become an exact mirror of this repo's source folders.

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
- If a target product folder does not exist on a device, that target is skipped.

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

- Because sync uses `--delete`, avoid manual edits in synced target folders (`~/.cursor/...`, `~/.roo/...`, etc.).
- Make all edits in this repo, then sync.
