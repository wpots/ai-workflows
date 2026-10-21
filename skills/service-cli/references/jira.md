# Jira via `jira` (ankitpokhrel/jira-cli)

## Install and verify

```bash
brew install ankitpokhrel/jira-cli/jira-cli
jira init          # once: site URL, login email, API token → ~/.config/.jira/.config.yml
jira me            # prints the configured user's email — the assignee filter value
jira serverinfo    # site URL and version
```

Headless (CI, routines): `JIRA_API_TOKEN` carries the token, `JIRA_LOGIN` the
account, and `-c .jira.yml` (or `JIRA_CONFIG_FILE`) the project's config. Read
the token with `npx dotenvx get`, never inline.

## A project's own config

`jira init` writes one machine default: one project, one board. A project on
another key or board checks its own config in as `.jira.yml` at the repo root,
so every developer and agent in that repo reaches the same project and sprint
board without `-p` and without touching their machine config:

```bash
# Once per project: generate, delete the `login:` line, commit the file
jira init -c .jira.yml --installation cloud --server https://<site>.atlassian.net \
  --login <your email> --auth-type basic --project <KEY> --board "<sprint board name>"

# Every command: from the repo root, -c after the subcommand
jira issue list -c .jira.yml --plain --columns key,status,summary
jira sprint list -c .jira.yml --state active --plain --columns ID,NAME,STATE
```

- **No `login` in the file.** It is the one personal line, and the CLI looks
  the token up by it (keychain or `.netrc`). Each developer sets
  `export JIRA_LOGIN=<email>` in their shell profile instead; without it every
  command fails with "The tool needs a Jira API token". The variable overrides
  the `login` of every config, the machine default included, which is harmless
  as long as it names the same Atlassian account.
- **`-c` after the subcommand.** `Bash(jira issue list *)` matches
  `jira issue list -c .jira.yml …`; `jira -c .jira.yml issue list …` matches
  no allow rule and costs an approval.
- **Keep the full `jira init` output.** `issue.fields.custom` is what
  `--custom <name>=<value>` resolves against, so do not trim it by hand;
  regenerate with `--force` (and drop `login` again) when the site adds fields.
- **`CONVENTIONS.md` § Tooling** names the file, the key and the board ids, so
  a skill reads them there instead of probing.

## Output modes

- `--plain` — a tab-separated table for the human reading along;
  `--columns key,status,assignee,summary` picks the columns, `--no-headers`
  drops the header line.
- `--raw` — the Jira API JSON. `issue list --raw` returns a top-level
  **array** of issues (there is no `.issues` wrapper); `issue view --raw`
  returns one issue object. Project with `jq` so only the fields the skill
  reads reach the context; `.fields.description` is ADF and large, leave it
  out unless the skill needs the text, and then use `--plain`, which renders it.

## Read

```bash
# Sprints on the configured board — ID is what `sprint add` and the skills need
jira sprint list --state active --plain --columns ID,NAME,STATE
jira sprint list --state future --plain --columns ID,NAME,START,END

# Issues by JQL — the sprint skills' main query
jira issue list --jql 'project = RFW AND sprint = "Sprint 8"' --raw \
  | jq '.[] | {key, summary: .fields.summary, status: .fields.status.name, type: .fields.issuetype.name, assignee: .fields.assignee.emailAddress, parent: .fields.parent.key}'

# Only the user's own tickets (email from `jira me`)
jira issue list --jql 'sprint = "Sprint 8"' -a "<email>" --plain --columns key,status,summary

# Beyond the first 100 rows
jira issue list --jql 'project = RFW AND status != Done' --raw --paginate 100:100

# One ticket with status, assignee, parent, links and fix versions
jira issue view RFW-323 --raw \
  | jq '{key, summary: .fields.summary, status: .fields.status.name, assignee: .fields.assignee.emailAddress, parent: .fields.parent.key, fixVersions: [.fields.fixVersions[].name], links: [.fields.issuelinks[] | {type: .type.name, outward: .outwardIssue.key, inward: .inwardIssue.key}]}'

# Description and acceptance criteria as readable text, with the last comments
jira issue view RFW-323 --plain --comments 5

# Which custom fields carry a value on this instance (story points, sprint)
jira issue view RFW-323 --raw \
  | jq '.fields | to_entries[] | select(.key | startswith("customfield")) | select(.value != null) | .key'

# Projects, epics, boards
jira project list
jira epic list --plain
jira board list
```

JQL `sprint = "Sprint 8"` matches the short name even when the board prefixes
it; the sprint **id** from `jira sprint list` is the reliable handle for
writes. A one-off look at another project: `-p <KEY>`, which does not change
the board `sprint list` reads. A project that works against another key or
board: its `.jira.yml` (§ A project's own config).

## Write — only the skills that are allowed to

`skills/jira-ticket` creates one issue; `skills/mr-merged` posts one comment.
Every other skill is read-only on the tracker.

```bash
# Create — body from a file written with the type template; the CLI renders
# Markdown to Jira's format. --no-input keeps it from prompting or opening an editor.
jira issue create -p RFW -t Bug -s "<summary>" -a "<email>" -T /path/to/body.md --no-input
# -P RFW-100 attaches an epic/parent; -l, -y, -C, -r only when the user asks
# --custom <name>=<value> sets a custom field by the name listed under
# issue.fields.custom in the CLI config (populated by `jira init`)

# Put the new issue in a sprint (numeric id from `jira sprint list`)
jira sprint add 1545 RFW-324

# Comment — body from a file, no editor
jira issue comment add RFW-324 -T /path/to/comment.md --no-input

# Transition — only after the user's go on this ticket (SKILL.md § Ticket status)
jira issue move RFW-324 "In Review"

# Edit, link, worklog
jira issue edit RFW-324 -s "<new summary>" --no-input
jira issue link RFW-324 RFW-100 "Blocks"
jira issue worklog add RFW-324 "1h 30m"
```

## Connector-only remainder

Confluence (search, pages, comments), the Teamwork Graph, Compass and Loom
have no `jira` command: use the Atlassian connector for those and say so in
the recap. Account-id lookup is not needed: `-a` takes an email or display
name.
