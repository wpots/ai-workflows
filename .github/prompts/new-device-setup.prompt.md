---
name: new-device-setup
description: "New Device Setup"
---

# New Device Setup

Bootstrap AI workflows on a new machine.

## Prerequisites Check

Before starting, verify these are installed:

1. `git` — `git --version`
2. `node` / `npm` — `node --version && npm --version`
3. `rsync` — `rsync --version`

If any are missing, stop and tell the user what to install.

## Steps

### 1. Clone the repo

```bash
git clone git@github.com:wpots/ai-workflows.git ~/Web/ai-workflows
cd ~/Web/ai-workflows
```

If SSH key is not set up, prompt the user to configure GitHub SSH access first.

### 2. Make sync script executable

```bash
chmod +x scripts/sync.sh scripts/validate-ai-instructions.sh
```

### 3. Run sync

```bash
./scripts/sync.sh
```

Report which targets were synced and which were skipped (missing IDE folders).

### 4. Add convenience alias

Check if alias already exists in `~/.zshrc` or `~/.bashrc` before adding:

```bash
echo 'alias ai-sync="$HOME/Web/ai-workflows/scripts/sync.sh"' >> ~/.zshrc
source ~/.zshrc
```

### 5. Verify

Run the validation script to confirm all AI instruction files are consistent:

```bash
./scripts/validate-ai-instructions.sh
```

### 6. Install git hooks (optional)

```bash
./scripts/install-hooks.sh
```

This installs a pre-commit hook that runs `validate-ai-instructions.sh` before each commit to catch drift.

## Post-Setup

- Edit workflows only in `~/Web/ai-workflows/`, never in synced target folders.
- After any change: `git add . && git commit -m "..." && git push && ai-sync`
- On other devices: `git pull && ai-sync`

**Important:** Do NOT run destructive commands (rm, reset) without confirmation.
