---
name: jira-ticket
description: "Create a Jira issue (bug, story, or task) from a consistent, type-specific template — gather the facts, ground it in the codebase where relevant, then create the issue with assignee and sprint after confirmation, through the jira CLI. Writes to the tracker. Project-agnostic: discover the project key, sprint id and field keys at runtime. Use when the user asks to file, log, create, or open a Jira ticket / bug / story / task (e.g. \"maak een jira ticket\", \"file a story\", \"meld een bug\", \"create a task\")."
metadata:
  owner: wieteke.pots
---

# Jira Ticket Skill

Use this skill when the user asks to create **any** Jira issue — a bug, a user
story, or a task. It **writes** to the tracker (creates one issue).

The goal: every ticket lands in Jira with a predictable, type-appropriate
template, short enough for the product owner to read in a minute; the backlog
item carries the developer's detail. The skill is project-agnostic — resolve
every instance-specific value at runtime rather than assuming it.

## Scope — tracker ticket, not a local backlog item

This skill creates the tracker issue and stops there. It does not write anything
under `docs/backlog/`.

- Need the local spec (acceptance criteria, technical notes) as well? Run
  `skills/backlog` afterwards with the key this skill returns.
- Delivering the work autonomously? `skills/work-backlog` consumes the local
  item, not the ticket — so a ticket without a matching backlog file is not yet
  pickable.

## The ticket is the feature, not the MR

A ticket describes the capability the product owner asked for. It is **not** sized
to one merge request: `skills/backlog` cuts it into as many items as
`rules/mr-sizing.md` requires, and each item becomes one MR.

So do not shrink a ticket to make it "MR-sized", and do not file several tickets
for what is one capability. Write the ticket at feature level, and mention in the
recap when the capability will obviously need several items — that is the
handover, not a warning.

The ticket is delivered when every local item carrying its key is done on the
default branch; `skills/mr-merged` posts the product-owner test instructions at
that moment, not per MR.

## Tracker write — safety

- This skill creates a Jira issue. **Always confirm the issue type, summary,
  assignee, and sprint with the user before running `jira issue create`.**
- Never transition, comment on, or edit existing issues unless explicitly asked.
- Create exactly one issue per request. Do not batch-create without approval.

## Step 0 — Determine the issue type

Pick from the user's intent:

- **Bug** — something is broken. Needs a reproduction path.
- **Story** — user-facing capability / feature. Needs value + acceptance criteria.
- **Task** — technical/chore work with no direct user story (refactor, config,
  spike, docs).

If the type is ambiguous, ask. The type drives the template (below) and the
`-t` value.

## Context to load

1. The project's tracker key (e.g. `RFW`, `ACME`). Look in `CONVENTIONS.md`,
   `README`, or infer from the branch prefix (`RFW-158`). Do **not** hardcode it.
2. For **bugs** and code-grounded **tasks**: the relevant source files, so the
   root cause / touchpoints are grounded and not guessed. For **stories**: the
   feature area, enough to write realistic acceptance criteria.
3. The CLI: `jira me` must print the configured user. Recipes and repair steps
   are in `skills/service-cli/references/jira.md`. The Atlassian connector is
   the fallback only when the CLI is not installed and cannot be installed now
   — see "Connector fallback" at the end, and say so in the recap.
4. Backlog items that already exist for this work: the tracked files in
   `docs/backlog/` **and** the untracked ones (`git status --porcelain
   docs/backlog/`), because another session may have written them without
   committing. When they exist, file the ticket from them — a
   `TBD — proposed <type> "<title>"` line in their `## Ticket` field names the
   ticket — and hand the new key to `skills/backlog` to write back.
5. The project's ticket conventions: language and format from `CONVENTIONS.md`
   (the tracker entry under Tooling). The language of a handful of existing
   tickets is not yet a convention: with no entry and fewer than ten tickets,
   ask once and propose recording the answer in `CONVENTIONS.md`.

## Workflow

1. **Gather the facts** into the type-specific template. If required fields are
   missing, ask before continuing:
   - Bug → reproduction steps, affected page/URL, role. A bug without a repro
     path is not actionable.
   - Story → the user role, the goal, the value ("so that…"), and at least one
     acceptance criterion.
   - Task → the concrete outcome / definition of done.
2. **Ground it in the codebase** (bugs + code tasks). Locate the actual file and
   lines, and only state a cause you can point at. If unconfirmed, write it as
   a hypothesis and label it — never invent. The `path/to/file.tsx:line`
   references go into the backlog item (`skills/backlog`); the ticket states
   the cause in plain words (see "Never in a ticket" under Ticket length).
   Offload heavy reading to a subagent to keep context clean.
3. **Resolve the Jira context:**
   - Project key → from "Context to load". When the repo has a `.jira.yml`,
     pass `-c .jira.yml` after the subcommand on every command instead (it also
     sets the board `sprint list` reads); otherwise `-p <KEY>` whenever it is
     not the CLI's configured default.
   - Issue type → `-t Bug` / `-t Story` / `-t Task` by name. When the instance
     names its types differently and the create is rejected, ask the user which
     name the project uses.
   - Assignee → `-a "<email or display name>"`; the CLI resolves it. Confirm
     the person first when the name could match more than one account.
   - Sprint (optional) → the numeric id from
     `jira sprint list --state active,future --plain --columns ID,NAME,STATE`.
     Skip for backlog tickets.
4. **Write the body** to a file in the scratchpad using the matching template,
   in Markdown — the CLI renders it to Jira's format. Write it in the project's
   ticket language (Context to load, 5), keeping established developer jargon
   in English, and under the issue type's own Jira template when the project
   has one (Jira gotchas). Then count it: `wc -w <path/to/body.md>` against the
   caps in "Ticket length".
5. **Confirm, then create.** Show the user: issue type + summary + assignee +
   sprint + project + the word count (Story: the criteria count too) + the
   tickets it links to. Over a cap: do not create, follow "Over the cap". On
   approval:

   ```bash
   jira issue create -p RFW -t Bug -s "<summary>" -a "<email>" \
     -T <path/to/body.md> --no-input
   jira sprint add <sprint-id> <NEW-KEY>      # only when a sprint was chosen
   jira issue link <A> <B> Blocks             # only the links named at the confirm step
   ```

   `--no-input` keeps the CLI from prompting for optional fields or opening an
   editor; without it the command blocks.
6. **Report back** the issue key and the URL the create command prints.

## Ticket length — the PO reads it in one minute

The ticket is read by the product owner, not the developer; a long ticket is
skimmed, and a skimmed ticket is accepted without being read. Hard caps,
counted with `wc -w <body.md>` over the whole body, headings included, before
the confirm step:

| Type  | Cap       | Sections                                                    |
| ----- | --------- | ----------------------------------------------------------- |
| Story | 250 words | User story, Acceptance criteria, Open questions (optional)  |
| Task  | 100 words | Goal, Definition of done, Open questions (optional)         |
| Bug   | 150 words | Steps to reproduce, Expected, Actual                        |

- **Story:** one user-story sentence plus at most two lines of context, only
  what the PO does not already know. At most 8 criteria, one sentence each
  (≤ 20 words), at capability level and observable by a PO. Edge cases,
  numbers, formulas and cache or build behaviour belong in the backlog item.
- **Out of scope:** one line, at most 3 items, only what a PO would otherwise
  assume is included.
- **Open questions:** at most 3, PO-facing, one line each:
  `<question>? <who answers> — holds up <which part>`. They mirror the backlog
  items' `Blocked on:` lines.
- **Dependencies:** Jira issue links, never prose. Name them at the confirm
  step — linking edits the other issue — and add them after the create with
  `jira issue link <A> <B> Blocks`; read the direction back once with
  `jira issue view <B> --plain`.
- **Sources:** one link (Notion, Figma), never quoted or summarised.
- **Never in a ticket:** tech notes, slicing or build order, function, token or
  library names, file paths or file names, line numbers, backlog file names,
  MR or commit links, and rejected alternatives. The backlog item is the
  developer's spec and carries the key; it holds all of this. Observable
  behaviour stays (a route, an environment variable, a header). A decision the
  PO has to sign off becomes an open question in PO terms, not a tech note.

A project whose `CONVENTIONS.md` names other caps or asks for code pointers in
tickets overrides this.

### Over the cap

Never trim silently and never create. At the confirm step show the count
(`11 criteria, 340 words`) and propose one of these; the user decides:

1. **Move the detail to the backlog item and lift the criteria to capability
   level.** The default: the criteria are usually edge cases and numbers.
2. **Split into two stories under the same epic**, when the PO could accept one
   without the other. Split by capability, never to make a ticket MR-sized (see
   "The ticket is the feature, not the MR").
3. **Group the criteria under short subheadings** when it is one capability with
   many rules. The caps still hold.

## Templates (ticket body)

Pick the one matching the issue type and stay inside its cap. Omit a section
only when truly not applicable. When the project's Jira issue type carries its
own description template, its headings win: map the sections below into them
(a Story template of `Omschrijving` + `Acceptatiecriteria` takes the user
story and context under the first) and keep Open questions after them.

### Bug

```markdown
## Steps to reproduce
Where: <page/URL, role, locale; device/browser if relevant>
1.
2.

## Expected
<what should happen>

## Actual
<what happens now; screenshot or video attached or linked; the cause in one
plain sentence when known>
```

### Story

```markdown
## User story
As a <role>, I want <goal>, so that <value>.
<At most two lines of context. One link to the design or source.>

## Acceptance criteria
- [ ] <one observable sentence, ≤ 20 words>

## Open questions (optional)
- <question>? <who answers> — holds up <which part>

Out of scope: <at most 3 items>
```

### Task

```markdown
## Goal
<one sentence: the outcome, and why when it is not obvious>

## Definition of done
- [ ] <concrete, checkable outcome>

## Open questions (optional)
- <question>? <who answers> — holds up <which part>
```

## Jira fields

Set only these — keep it minimal:

| Field      | Value                                                       |
| ---------- | ----------------------------------------------------------- |
| project    | `-c .jira.yml` when the repo has one, else `-p <KEY>`       |
| issue type | `-t Bug` / `-t Story` / `-t Task`                           |
| assignee   | `-a "<email>"` (confirm the person first)                   |
| sprint     | `jira sprint add <id> <KEY>` after creation (optional)      |

No priority, labels, components, or reporter overrides unless the user asks
(`-y`, `-l`, `-C`, `-r`); no parent unless the user names the epic (`-P`).

## Jira gotchas

- **`--no-input` always**, and the body through `-T <file>` (or `-b` for one
  line): the CLI otherwise prompts for every optional field.
- **Sprint by id, after creation.** `jira sprint add` takes the numeric id from
  `jira sprint list`; JQL `sprint = "Sprint N"` matches the short name even when
  the real name is prefixed, so the list is the reliable lookup.
- **Custom fields** (story points, a non-default sprint field) go in with
  `--custom <name>=<value>`, where the name is the one listed under
  `issue.fields.custom` in the CLI config (populated by `jira init`). Which
  custom fields carry values on this instance:
  `jira issue view <KEY-in-sprint> --raw | jq '.fields | to_entries[] | select(.key | startswith("customfield")) | select(.value != null) | .key'`
  — keys differ per Jira site, so discover, never assume.
- **Another project or board** than the machine default: the repo's
  `.jira.yml`, with `-c .jira.yml` after the subcommand on every command and
  `JIRA_LOGIN` set (`skills/service-cli/references/jira.md` § A project's own
  config). Without one, `-p <KEY>` reaches another project but not its board.
- **An issue type's description template.** Jira can prepend a per-type
  template to the description on create, and the CLI shows no sign of it (seen
  on a Story type in 2026-10; holds while the project configures one). After
  the first create of each type, run `jira issue view <KEY> --plain` once. If
  an empty template sits above the body, rewrite the body to its headings and
  replace the description — part of the approved create, not a separate edit:

  ```bash
  jira issue edit <KEY> --no-input --skip-notify < body.md
  ```

  Stdin replaces the whole description; `--skip-notify` spares the watchers a
  mail per fix. Write later tickets of that type to the template from the
  start.
- **Several issues into an epic** after creation:
  `jira epic add <EPIC> <KEY>…` (checked on a classic project, 2026-10).
- **Transition names belong to the workflow**, not the target status:
  `jira issue move <KEY> "Open"` fails with `invalid transition state` and
  lists the workflow's names (such as `progress naar open`); pass one of those.
  Transition only on an explicit ask (Tracker write — safety).

## Connector fallback

Only when `jira` is not installed and cannot be installed now, and say so in
the recap. Through the Atlassian connector: `cloudId` from
`getAccessibleAtlassianResources`; `createJiraIssue` with `issueTypeName`
(the numeric id via `getJiraProjectIssueTypesMetadata` only if the name is
rejected); the assignee `accountId` via `lookupJiraAccountId` (confirm on more
than one match); the sprint as its numeric id under the instance's sprint
field key, discovered by reading an issue already in the target sprint with
`fields: ["*all"]` in a subagent (the default `customfield_10020` is `null` on
some instances); `contentFormat: "markdown"` for the body.

## Constraints

- Confirm before creating. One issue per request.
- Stay inside the caps in "Ticket length"; over a cap, ask — never trim
  silently, never create.
- Ground bugs/code-tasks in real code; mark anything unproven as a hypothesis.
- Discover instance-specific ids at runtime; assume nothing is hardcoded.

## Output

- The created issue key and URL.
- A one-line recap of issue type + assignee + sprint.
- Any assumption (e.g. an unconfirmed root cause) the user still needs to verify.
