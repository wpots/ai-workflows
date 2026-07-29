# Set Up a New Device

Bootstrap AI workflows on a new machine.

## Prerequisites Check

Before starting, verify these are installed:

1. `git` — `git --version`
2. `node` / `npm` — `node --version && npm --version`
3. `rsync` — `rsync --version`
4. `glab` — `glab --version` (`brew install glab`)
5. `jira` — `jira version` (`brew install jira-cli`)

If any are missing, stop and tell the user what to install.

Then authenticate the CLIs (once per machine):

- `glab auth login` with a **Personal Access Token** (scopes `api` +
  `write_repository`) — PATs avoid OAuth refresh races.
- `jira init` with a Jira API token.
- `dotenvx` needs no install or auth — commands run it via `npx dotenvx`.
- claude.ai connectors (Atlassian, Figma) are authorized per user in the
  claude.ai connector settings — the Jira- and Figma-backed skills depend on
  them.

The CLI-vs-MCP doctrine and the full tooling table live in `docs/tooling.md`.

## Steps

### 1. Clone the repo

```bash
git clone git@gitlab.com:greenberrynl/config/ai-workflows.git ~/Web/ai-workflows
cd ~/Web/ai-workflows
```

If SSH access is not set up, prompt the user to configure GitLab SSH access
first.

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

### 7. (Optional) Install graphify for knowledge-graph context

`graphify` gives agents a scoped knowledge graph of a codebase. It is per-developer;
the graph data (`graphify-out/`) is gitignored, so build it locally in each repo.

```bash
brew install uv                 # if uv is not installed
uv tool install graphifyy       # installs the graphify CLI to ~/.local/bin
```

Then, inside a repo whose sync includes graphify config:

```bash
graphify install                # register rules/hooks for local agents
graphify update .               # build the initial local graph
```

## Post-Setup

- Edit workflows only in `~/Web/ai-workflows/`, never in synced target folders.
- After any change: `git add . && git commit -m "..." && git push && ai-sync`
- On other devices: `git pull && ai-sync`

**Important:** Do NOT run destructive commands (rm, reset) without confirmation.
