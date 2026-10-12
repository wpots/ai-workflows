# Org-Managed Plugin Settings

Step-by-step for the **Teams Owner**: register the `ai-workflows` marketplace,
with auto-update on, for every teammate from the claude.ai admin console. Once
this is in place, a new teammate finds the marketplace on the first launch of
Claude Code and installs the `greenberry` plugin with one command, and nobody's
install can freeze on an old version. The plugin itself is **not** forced: it
stays enabled per project by the `.claude/settings.json` that sync writes into
every Greenberry project, and a teammate can still disable it. Force-enabling
is a later step, see [Later: force-enable the plugin](#later-force-enable-the-plugin).

Statements marked **(unconfirmed)** are not in the official Claude Code docs or
were not tested; everything else is sourced at the end.

## Before You Start

- **Who can do this.** Only an **Owner** or **Primary Owner** of the Claude for
  Teams organization can view or edit server-managed settings. A member sees a
  "no access" message on the page.
- **Who it affects.** Server-managed settings apply to **every member** of the
  organization who signs in to Claude Code with their Teams account. There is no
  per-group targeting.
- **What every teammate needs.** The repository is **private** on GitLab, and
  Claude Code clones it with the git credentials already on each machine and
  never prompts. With the JSON below, each teammate needs:
  - read access to `greenberrynl/config/ai-workflows` on GitLab;
  - an SSH key on GitLab that works without a passphrase prompt (loaded in
    `ssh-agent`), with `gitlab.com` already in `known_hosts`. Running
    `ssh -T git@gitlab.com` once and seeing `Welcome to GitLab, @you!` covers
    both;
  - Claude Code signed in with their Greenberry Teams account (`/login`). A
    session on a personal account, an API key from another organization, or a
    shell that exports `CLAUDE_CODE_USE_BEDROCK`/`_VERTEX` or a custom
    `ANTHROPIC_BASE_URL` does not receive these settings.

A member without GitLab access still receives the settings, and the clone fails
on their machine. What `/plugin` shows them then is **unconfirmed**.

## What Changes On A Teammate's Machine

- The `ai-workflows` marketplace is registered, and its auto-update is on and
  cannot be turned off. A teammate's own `ai-workflows` entry is replaced by the
  managed one.
- Nothing is installed. The `greenberry` plugin arrives the way it does today:
  `/plugin install greenberry@ai-workflows`, or the project settings of a
  synced Greenberry project, which enable it there. The teammate keeps control:
  they can disable or uninstall it.
- Once the plugin runs, it behaves as it does today: it adds the
  `/greenberry:*` skills and runs its hooks from
  [`hooks/hooks.json`](../hooks/hooks.json), including the `SessionStart` hook
  that writes `~/.claude/CLAUDE.md` and the universal rules into
  `~/.claude/rules/` (see
  [setup-machine.md](setup-machine.md#the-ambient-layer-updates-itself)).

**Decided 2026-10-12 by the maintainer:** register the marketplace org-wide,
but do not force-enable the plugin yet. A forced plugin runs its hooks in every
session of every member with no off switch, replaces everyone's
`~/.claude/CLAUDE.md`, and a bad release reaches everyone at once, while
server-managed settings offer no early-access channel and the automated
release train has not proven itself yet. Revisit after a few clean automated
releases and a one-week pilot with one or two teammates.

## The JSON To Paste

```json
{
  "extraKnownMarketplaces": {
    "ai-workflows": {
      "source": {
        "source": "git",
        "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git"
      },
      "autoUpdate": true
    }
  }
}
```

### What each key does

| Key | Effect |
| --- | --- |
| `extraKnownMarketplaces` | Registers the marketplace on every machine. The key `ai-workflows` must equal the `name` in [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json). A managed entry **replaces** any same-name entry a teammate already has in their own or a project's settings; the fields do not merge. |
| `source.source: "git"` | The marketplace is a git repository to clone. Not `"url"`: for a marketplace source, `url` means "download one `marketplace.json` file", and our plugin lives in the repo itself. |
| `source.url` | The clone URL. SSH, the same URL as the manual install and the project template, so nobody's marketplace source changes. See [Choosing the URL](#choosing-the-url). |
| `autoUpdate: true` | Refreshes the marketplace and its plugins in the background after a session starts. Set here, a teammate's `/plugin` toggle is refused. |

There is deliberately no `enabledPlugins` key: that would install and
force-enable the plugin (see [Later](#later-force-enable-the-plugin)).

No key in this JSON triggers the security approval dialog that hooks, shell
helpers, and some `env` variables in managed settings trigger, so teammates see
no prompt. (The plugin's own hooks are plugin components, not managed hooks.)

### Choosing the URL

There is one URL for everyone, because the managed entry replaces each
teammate's own.

- **SSH (decided 2026-10-12 for the first rollout, used above).** Matches
  [setup-machine.md](setup-machine.md#2-install) and
  [`templates/project-claude-settings.json`](../templates/project-claude-settings.json).
  Requires the SSH key described above.
- **HTTPS**, `https://gitlab.com/greenberrynl/config/ai-workflows.git`. Works
  for a teammate whose git credential helper already holds a GitLab credential
  (for example through `glab auth login`). The official docs say a background
  auto-update over HTTPS succeeds when the helper can answer without prompting;
  this repo's own docs say HTTPS installs never auto-update. Which one holds for
  `glab` as the helper is **unconfirmed** — test on one machine before switching.

## Step By Step For The Teams Owner

1. Sign in to [claude.ai](https://claude.ai) with your Owner account.
2. Open **Organization settings > Claude Code > Managed settings**, or go
   straight to <https://claude.ai/admin-settings/claude-code>.
3. Find the managed settings JSON field. (The docs say the configuration is
   added "as JSON"; the field's exact label is **unconfirmed**.)
4. If the field is **empty**, paste the JSON above as is.
   If it **already contains settings**, do not replace them. Add the
   `extraKnownMarketplaces` key inside the existing outer `{ … }`, separated by
   a comma. If `extraKnownMarketplaces` already exists, add the
   `"ai-workflows"` entry inside it instead of adding the key a second time.
5. Save. (The save button's exact label is **unconfirmed**.)
6. Tell the maintainer it is saved, so one teammate can verify right away (next
   section). There is no staged rollout: it applies to everyone at once.

How fast it lands: Claude Code fetches server-managed settings at startup and
polls hourly in a running session. The marketplace is registered at the start
of the next session, so the reliable path is for each teammate to quit and
restart Claude Code once.

## Verify On A Teammate's Machine

1. Quit every running Claude Code session and start `claude` again.
2. Run `/status`. The `Setting sources` line lists
   `Enterprise managed settings (remote)`.
3. Run `/plugin`. The **Marketplaces** tab lists `ai-workflows`, and its
   auto-update toggle cannot be switched off.
4. A teammate without the plugin runs `/plugin install greenberry@ai-workflows`;
   one who already has it sees no change. In a shell,
   `claude plugin list` then shows `greenberry@ai-workflows` as enabled.
5. Type `/greenberry:`. The skills appear.

The clone runs in the background after the session starts, so on the very first
launch the marketplace can arrive mid-session. Run `/reload-plugins` when
Claude Code asks for it, or restart once more.

If a step fails:

| Symptom | Check |
| --- | --- |
| No `Enterprise managed settings (remote)` in `/status` | Run `claude doctor` and read the `Managed settings (remote)` line (Claude Code v2.1.248 or later; `claude update` first). It says whether the fetch loaded, failed, was skipped, or found nothing configured. |
| `/status` is fine, but `/plugin` shows an error for `ai-workflows` | The clone failed: run `ssh -T git@gitlab.com` and fix GitLab access. |
| A once-a-day session note says the marketplace entry has no `autoUpdate` | The ambient-layer hook reads only `~/.claude/settings.json`, not managed settings. An old `ai-workflows` entry there without `"autoUpdate": true` triggers it although the managed entry turns auto-update on. Add `"autoUpdate": true` to that old entry; it is harmless and still right if the org settings are ever removed. |

## Roll Back

**A bad plugin release** is rolled back in this repo, not in the admin console:
revert the MR on `main`, and auto-update carries the revert to everyone.

**Stop managing the marketplace:**

1. The Teams Owner opens the same page, deletes the `"ai-workflows"` entry from
   `extraKnownMarketplaces` (or the whole key, if nothing else is in it), and
   saves.
2. Clients pick it up at their next start or within the hour. A machine keeps
   its cached copy of the settings until its next successful fetch.

Whether Claude Code then unregisters the marketplace on each machine, or leaves
it registered under the teammate's control, is **unconfirmed**. A teammate who
wants it gone runs `claude plugin marketplace remove ai-workflows`, which also
uninstalls the plugins from it.

**Block the plugin everywhere** (for example an incident where waiting for a
revert is too slow): set `"greenberry@ai-workflows": false` in the managed
`enabledPlugins` and save. Managed `false` blocks the plugin at every scope and
hides it from the marketplace listing.

## Optional: Allow Only Known Marketplaces

`strictKnownMarketplaces` is an **explicit opt-in**, not part of the JSON above.
It is an allowlist of marketplace sources. Once it is set, for every member of
the organization:

- adding, installing from, or updating any marketplace whose source is not on
  the list fails with `is blocked by enterprise policy`;
- plugins already installed from an unlisted marketplace **stop loading** at
  the next session start;
- plugins kept under `~/.claude/skills/` or a project's `.claude/skills/` with
  a `.claude-plugin/plugin.json` stop loading unless the list contains
  `{ "source": "skills-dir" }`;
- marketplaces hosted on claude.ai (named `claudeai-*`) are blocked unless the
  list has a `hostPattern` entry for `claude.ai`;
- claude.ai also refuses an unlisted git repository when anyone adds a
  marketplace there or under **Customize** in Claude Desktop.

Plugins synced from claude.ai (`<name>@synced`) are not marketplace plugins and
are not affected.

Matching is exact for `git` sources: the `url`, `ref`, and `path` must equal
the source as registered. `git@gitlab.com:…` and `https://gitlab.com/…` are
different values, as is a missing `.git` suffix. The allowlist does not register
anything on its own, so a listed marketplace still needs its
`extraKnownMarketplaces` entry.

The marketplaces in use today, from the maintainer's machine
(`claude plugin marketplace list`):

| Marketplace | Allowlist entry |
| --- | --- |
| `ai-workflows` | `{ "source": "git", "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git" }`. Must be identical to the URL in `extraKnownMarketplaces`. |
| `claude-plugins-official` | `{ "source": "github", "repo": "anthropics/claude-plugins-official" }` |
| Skills-directory plugins | `{ "source": "skills-dir" }`. None on the maintainer's machine; keeps teammates' personal ones working. |
| claude.ai-hosted marketplaces | `{ "source": "hostPattern", "hostPattern": "^claude\\.ai$" }`, only if someone uses one (Claude Code v2.1.273 or later). |

Other teammates may use marketplaces this table does not know. Before opting
in, ask each teammate for the output of `claude plugin marketplace list` and add
what they need. The full opt-in JSON, merged with the base JSON:

```json
{
  "strictKnownMarketplaces": [
    { "source": "git", "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git" },
    { "source": "github", "repo": "anthropics/claude-plugins-official" },
    { "source": "skills-dir" }
  ],
  "extraKnownMarketplaces": {
    "ai-workflows": {
      "source": {
        "source": "git",
        "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git"
      },
      "autoUpdate": true
    },
    "claude-plugins-official": {
      "source": { "source": "github", "repo": "anthropics/claude-plugins-official" }
    }
  }
}
```

The official marketplace gets an explicit `extraKnownMarketplaces` entry
because under an allowlist it only registers itself in an interactive terminal
session.

Recommendation: roll out the base JSON first, confirm it on a few machines, and
treat the allowlist as a separate decision once the inventory is complete. It is
the only plugin trust control available (there is no plugin signing), but a
wrong entry silently stops plugins from loading for the whole organization.

Not recommended alongside it: `disableSideloadFlags`, which also rejects
`--plugin-dir`, the flag for testing a local copy of a plugin.

## Later: Force-Enable The Plugin

Not now (see the decision above). When the conditions are met, the Teams Owner
adds this key next to `extraKnownMarketplaces`:

```json
"enabledPlugins": {
  "greenberry@ai-workflows": true
}
```

`"<plugin>@<marketplace>": true` installs and force-enables the plugin;
`greenberry` is the entry `name` in `marketplace.json`, and managed `true`
cannot be overridden by any other settings file. From then on every member gets
the plugin, its hooks and the ambient layer at session start, cannot disable or
uninstall it, and finds their own `~/.claude/CLAUDE.md` replaced the first time
the plugin delivers different content. Tell the team before saving.
Verification then changes: `/plugin` lists `greenberry` at **Managed** scope.
Rolling back means deleting this entry as well.

## Not Covered Here

- **Release channels** (stable and early access) need two marketplaces with
  different names on different refs, and a way to give each group its own.
  Server-managed settings apply to everyone alike, so that needs MDM or a
  gateway policy. Not worth it at our size.
- **Organization settings > Plugins & skills** on claude.ai is a different
  route: it syncs the repository through the organization's GitLab connection,
  so teammates need no git credentials, and the plugin arrives as
  `greenberry@synced` instead of `greenberry@ai-workflows`. Whether our plugin
  layout (the repo root as the plugin) is accepted there is **unconfirmed**.
- Devices under MDM: if a `managed-settings.json` or MDM profile is ever added,
  server-managed settings win by default and the plugin keys in the other
  source are ignored.

## Sources

- [Manage Claude Code plugins for your organization](https://code.claude.com/docs/en/plugins/org)
- [Configure server-managed settings](https://code.claude.com/docs/en/server-managed-settings)
- [Deploy managed settings](https://code.claude.com/docs/en/managed-settings)
- [Settings files and precedence](https://code.claude.com/docs/en/settings)
- [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference)
- [Host and maintain a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace)
- [Plugin loading reference](https://code.claude.com/docs/en/plugins/loading)
- [Install and manage plugins](https://code.claude.com/docs/en/plugins/install)
