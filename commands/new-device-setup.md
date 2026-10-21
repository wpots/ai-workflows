# Set Up a New Device

Bootstrap AI workflows on a new machine.

## Prerequisites Check

Before starting, verify these are installed:

1. `git` — `git --version`
2. `node` / `npm` — `node --version && npm --version`
3. `pnpm` — `pnpm --version` (`brew install pnpm`); needed for unicore-template
   v4 and every project created from it. pnpm runs the version a project pins
   in `packageManager`.
4. `rsync` — `rsync --version`
4. `glab` — `glab --version` (`brew install glab`)
5. `jira` — `jira version` (`brew install ankitpokhrel/jira-cli/jira-cli`)
6. `axiom` — `axiom version` (`brew install --cask axiomhq/tap/axiom`); only
   on machines that work on a project with Axiom logging

If any are missing, stop and tell the user what to install.

Then authenticate the CLIs (once per machine):

- `glab auth login` with a **Personal Access Token** (scopes `api` +
  `write_repository`) — PATs avoid OAuth refresh races.
- `jira init` with a Jira API token, and `export JIRA_LOGIN=<Atlassian email>`
  in the shell profile: a project's checked-in `.jira.yml` carries no login.
- `axiom auth login` with a personal API token, when installed.
- `dotenvx` needs no install or auth — commands run it via `npx dotenvx`.
- claude.ai connectors (Atlassian, Figma, Axiom) are authorized per user in the
  claude.ai connector settings. They cover only what the CLI cannot reach
  (Confluence, the Teamwork Graph, Figma, Axiom monitors and dashboards); the
  Jira-backed skills run on the `jira` CLI.

Verify the auth actually works before moving on: `glab auth status` and
`jira me` must both succeed (`axiom auth status` too, when installed).

The CLI-vs-MCP doctrine and the full tooling table live in `docs/tooling.md`;
the per-service recipes in `skills/service-cli`.

## Steps

### 1. Clone the repo

Only Claude Code, and not changing the shared config? Skip the clone: install
the plugin (the first paragraph of step 3) and continue at step 7. Skills,
commands, project templates and the ambient layer all come with the plugin.
Clone when you use Codex, run `sync.sh --project`, or change the shared config.

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

Claude Code users: make sure the `greenberry` plugin is in place first, because
sync removes old skill copies from `~/.claude`. Start `claude` once and run
`/plugin`. With the org-managed settings in place
(`docs/org-managed-plugin-settings.md`), it lists the `ai-workflows` marketplace
on first launch; install the plugin with `/plugin install greenberry@ai-workflows`.
Without the marketplace, install it by hand per `docs/setup-machine.md`
("Claude Code: Install The Plugin").

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
