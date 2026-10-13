# Set Up Your Machine

One-time developer setup, ~5 minutes. Do this once per machine, per tool you
use. Setting up a *project* is a separate thing — see
[adopt-new-project.md](adopt-new-project.md) or
[adopt-existing-project.md](adopt-existing-project.md).

## Do I Need A Local Clone?

Not if you only use Claude Code. Whether you need one, and how often you run
`sync.sh`, depends on your tool and your role.

| You are… | How often you run `sync.sh` |
| -------- | --------------------------- |
| A Claude Code user working in already-synced projects | Never, in the normal case. Skills and commands arrive through the `greenberry` plugin, and the plugin's `SessionStart` hook refreshes the ambient layer on its own — see [The ambient layer updates itself](#the-ambient-layer-updates-itself). |
| A Codex user | After every update you want. Codex has no plugin path, so `sync.sh` is its only delivery mechanism for skills and commands. |
| Onboarding a project, or refreshing one | Never on Claude Code: `start-project` and `setup-ai-workflows` read the rules, templates and scripts from the plugin. With the script instead (`sync.sh --project <path>`, e.g. for Codex) every time — it renders adapters from `templates/` and `shared/` inside the checkout, so it cannot run without one. |
| Editing the shared config itself | Per change — see [contributing.md](contributing.md). |

What you give up on Claude Code by never cloning at all: nothing, in the normal
case. The clone is for Codex, for the `sync.sh --project` script, and for
changing the shared config.

Why Claude is the odd one out: plugins have no primitive for always-on context,
so the ambient layer stays a file copy into `~/.claude` by design. It is still
delivered by the plugin, though — a `SessionStart` hook does the copy — so
Claude users get both halves automatically.

## Clone The Repo

```bash
git clone git@gitlab.com:greenberrynl/config/ai-workflows.git ~/Web/ai-workflows
cd ~/Web/ai-workflows
./scripts/generate-adapters.sh
./scripts/sync.sh
```

`sync.sh` with no flags writes the reusable assets into local agent folders:

- `~/.codex/skills/custom`
- `~/.claude/rules`: this repo's `CLAUDE.md` as `ai-workflows.md`, plus the
  universal rules subset

`~/.claude/CLAUDE.md` is never written; it holds your own instructions.
All commands, rules, and skills sync by default; there is no separate opt-in
tier. Codex system skills are never touched (only `~/.codex/skills/custom`).
Nothing MCP-related is written globally — project MCP config lives in each
project's `.mcp.json` (see [tooling.md](tooling.md)).

Claude Code is the exception to file-copy sync: it gets skills and commands from
the plugin, and sync *removes* copies left behind by earlier syncs (repo-owned
names only — personal skills stay) so they cannot shadow the plugin.

Cursor is not supported: sync writes nothing to `~/.cursor`. Earlier syncs left
two copies there. They are stale and harmless, and removing them is optional:

- `~/.cursor/skills-cursor/ai-workflows` was a dedicated folder, so delete it as
  a whole.
- `~/.cursor/commands` mirrored this repo's `commands/`. Delete it too, unless
  you added commands of your own there; in that case remove only the files that
  share a name with `commands/*.md`.

## Install And Authenticate The CLI Baseline

The workflows hard-depend on a few CLIs; install and authenticate them once:

```bash
brew install glab jira-cli
glab auth login   # Personal Access Token, scopes: api + write_repository
jira init         # Jira API token
```

Verify the auth actually works: `glab auth status` and `jira me` must both
succeed. `dotenvx` needs no install or auth — commands run it via
`npx dotenvx`. claude.ai connectors (Atlassian, Figma) are authorized per user
in the claude.ai connector settings. The CLI-vs-MCP doctrine and the full
tooling table live in [tooling.md](tooling.md).

## Claude Code: Install The Plugin

Do this **before** running `sync.sh`, because sync removes the old skill copies
from `~/.claude` — installing first means you are never without skills.

> **Org-managed settings.** When the Teams Owner has applied
> [org-managed-plugin-settings.md](org-managed-plugin-settings.md), the
> marketplace arrives on your first launch with auto-update on: do step 1,
> start Claude Code once, run only the `/plugin install` line of step 2, skip
> step 3, then check step 4. If `/plugin` does not list the `ai-workflows`
> marketplace, follow steps 2 and 3 in full.

### 1. Check GitLab access

The marketplace clones over git. Test SSH with `ssh -T git@gitlab.com` — a
`Welcome to GitLab, @you!` means you are set.

No SSH key? Either add one under *GitLab → Preferences → SSH Keys*
(recommended; background auto-update only works over SSH), or use the HTTPS URL
in step 2 — install and manual refresh then run through your `glab` login, but
background auto-updates stay off.

### 2. Install

Inside Claude Code:

```
/plugin marketplace add git@gitlab.com:greenberrynl/config/ai-workflows.git
/plugin install greenberry@ai-workflows
```

HTTPS variant: `/plugin marketplace add https://gitlab.com/greenberrynl/config/ai-workflows.git`

### 3. Turn on auto-update — `/plugin marketplace add` does not

Without this the install is frozen at whatever `main` looked like the day you
ran it. Add the flag to `~/.claude/settings.json`:

```json
"extraKnownMarketplaces": {
  "ai-workflows": {
    "source": {
      "source": "git",
      "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git"
    },
    "autoUpdate": true
  }
}
```

The inner `"source": "git"` is load-bearing. For a *marketplace* source, Claude
Code reads `"git"` as "clone this repository" and `"url"` as "download a
`marketplace.json` from this address" — and validates the latter as a real URL,
so `"url"` plus our `git@…` address fails with `invalid url`. (Inside a
`marketplace.json`, *plugin* entries use the opposite convention, where `"url"`
is the git-repo type. Don't copy one into the other.)

**You get told when this is wrong.** The ambient-layer hook checks two things at
session start, offline, and mentions at most one of them once a day:

- the marketplace entry in `~/.claude/settings.json` has no `autoUpdate` — the
  exact state that leaves an install frozen while everything looks fine
- the plugin cache has not changed in over two weeks, which is what a silently
  failing auto-update looks like (HTTPS-registered marketplace, expired git auth)

Both are advisory. The hook cannot fix a frozen plugin — the source it copies
from is the stale thing — so it names the fix and leaves it to you. Until it is
fixed, `./scripts/sync.sh` overrides the ambient layer immediately.

### 4. Verify

- `/plugin` lists `greenberry` as installed and enabled, tracking `main` rather
  than the commit you installed at.
- Typing `/greenberry:` shows the skills.
- Asking for e.g. a commit message in plain language still triggers the skill
  through its `description`.

### How it behaves

- Plugin skills invoke as `/greenberry:<skill>` (for example
  `/greenberry:create-pr`). Natural-language triggers keep working through each
  skill's `description` frontmatter.
- Updates arrive automatically over SSH; Claude Code prompts to reload when
  something new landed.
- The ambient layer rides along automatically too — see below.

## The Ambient Layer Updates Itself

Plugins have no primitive for always-on context, so `CLAUDE.md` and the
universal rules cannot ship as plugin *components*. They no longer need a manual
sync anyway: the plugin cache holds a full copy of this repo, so a `SessionStart`
hook in [`hooks/hooks.json`](../hooks/hooks.json) runs
[`scripts/sync-ambient.sh`](../scripts/sync-ambient.sh) from
`$CLAUDE_PLUGIN_ROOT` and refreshes those files in `~/.claude/rules/`, where
`CLAUDE.md` lands as `ai-workflows.md`. The hook ships in the plugin, so nobody
edits their own `settings.json` to get it.

`~/.claude/CLAUDE.md` stays yours. Plugin versions before this change wrote the
baseline there; the first sync after the update deals with such a copy once. A
copy nobody edited is removed, an edited copy is moved to
`~/.claude/CLAUDE.md.ai-workflows-backup`, and the session says which happened.
A `~/.claude/CLAUDE.md` without the baseline's opening line ("Use this setup as
a universal Claude Code baseline across projects.") is never touched.

It is gated on a digest of the files it delivers — `CLAUDE.md`, the universal
rules, and the sync script itself — stamped in `$CLAUDE_PLUGIN_DATA`, which
survives plugin updates. Deliberately *not* on the plugin version:
`$CLAUDE_PLUGIN_ROOT` is version-keyed
(`~/.claude/plugins/cache/ai-workflows/greenberry/1.8.0`, and only SHA-keyed
while `plugin.json` carries no `version` at all), so two different commits of
`main` share one directory name whenever an MR skips the bump. A version gate
reads that as "already applied" and skips the change forever — which is exactly
the bug this replaced. Consequences worth knowing:

- Sessions where the delivered files are byte-identical are a silent no-op.
- A deliberate local edit to `~/.claude/rules/ai-workflows.md` survives until
  the plugin delivers different content, rather than being reverted at every
  session start — a local edit does not change the source digest. Personal
  instructions belong in `~/.claude/CLAUDE.md`, which no update overwrites.
- When it does act, it says so in the session context — you are never silently
  running on refreshed rules.
- A stale plugin still pins the ambient layer to older content. If `/plugin`
  shows an install that lags `main`, fix the auto-update first (see
  [troubleshooting.md](troubleshooting.md)) — the hook only helps if the channel
  it rides is current.

`./scripts/sync.sh` calls the same script (with `--source` pointing at your local
checkout) so there is one owner for the universal-subset list. Running sync by
hand always applies, regardless of the stamp.

## Optional: Knowledge Graph (graphify)

[graphify](https://github.com/safishamsi/graphify) builds a queryable knowledge
graph of a codebase so agents can ask scoped questions instead of grepping raw
files. Adapter guidance lives in `shared/graphify.md` (injected into the
CLAUDE/AGENTS/Copilot templates), and project sync writes a graphify-hooked
`.claude/settings.json` (only when the project has none). Everything is guarded
on `graphify-out/graph.json`, so it no-ops in repos without a graph.

The graph data (`graphify-out/`) is gitignored, so each developer builds their
own:

```bash
brew install uv                 # if uv is not installed
uv tool install graphifyy       # installs the graphify CLI to ~/.local/bin
graphify install                # register rules/hooks for the local agents
graphify update .               # build the initial local graph
```

After that, `graphify update .` (also run automatically by the Claude PostToolUse
hook) keeps the graph current — AST-only, no API cost.

## Next

- A project to onboard → [adopt-new-project.md](adopt-new-project.md) or
  [adopt-existing-project.md](adopt-existing-project.md)
- Already set up, want to stay current → [keep-current.md](keep-current.md)
- Something wrong → [troubleshooting.md](troubleshooting.md)
