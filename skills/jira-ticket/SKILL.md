---
name: jira-ticket
description: Create a Jira issue (bug, story, or task) from a consistent, type-specific template — gather the facts, ground it in the codebase where relevant, then create the issue with assignee and sprint after confirmation, through the jira CLI. Writes to the tracker. Project-agnostic: discover the project key, sprint id and field keys at runtime. Use when the user asks to file, log, create, or open a Jira ticket / bug / story / task (e.g. "maak een jira ticket", "file a story", "meld een bug", "create a task").
---

# Jira Ticket Skill

Use this skill when the user asks to create **any** Jira issue — a bug, a user
story, or a task. It **writes** to the tracker (creates one issue).

The goal: every ticket lands in Jira with a predictable, type-appropriate
template, so a developer can pick it up directly. The skill is project-agnostic —
resolve every instance-specific value at runtime rather than assuming it.

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

## Workflow

1. **Gather the facts** into the type-specific template. If required fields are
   missing, ask before continuing:
   - Bug → reproduction steps, affected page/URL, role. A bug without a repro
     path is not actionable.
   - Story → the user role, the goal, the value ("so that…"), and at least one
     acceptance criterion.
   - Task → the concrete outcome / definition of done.
2. **Ground it in the codebase** (bugs + code tasks). Locate the actual file and
   lines, reference them as `path/to/file.tsx:line`, and only state a cause /
   touchpoint you can point at. If unconfirmed, write it as a hypothesis and
   label it — never invent. Offload heavy reading to a subagent to keep context
   clean.
3. **Resolve the Jira context:**
   - Project key → from "Context to load"; pass it as `-p <KEY>` whenever it
     is not the CLI's configured default.
   - Issue type → `-t Bug` / `-t Story` / `-t Task` by name. When the instance
     names its types differently and the create is rejected, ask the user which
     name the project uses.
   - Assignee → `-a "<email or display name>"`; the CLI resolves it. Confirm
     the person first when the name could match more than one account.
   - Sprint (optional) → the numeric id from
     `jira sprint list --state active,future --plain --columns ID,NAME,STATE`.
     Skip for backlog tickets.
4. **Write the body** to a file in the scratchpad using the matching template,
   in Markdown — the CLI renders it to Jira's format. Match the language and
   English/native-term mix of the project's existing tickets.
5. **Confirm, then create.** Show the user: issue type + summary + assignee +
   sprint + project. On approval:

   ```bash
   jira issue create -p RFW -t Bug -s "<summary>" -a "<email>" \
     -T <path/to/body.md> --no-input
   jira sprint add <sprint-id> <NEW-KEY>      # only when a sprint was chosen
   ```

   `--no-input` keeps the CLI from prompting for optional fields or opening an
   editor; without it the command blocks.
6. **Report back** the issue key and the URL the create command prints.

## Templates (ticket body)

Pick the one matching the issue type. Omit a section only when truly not
applicable. Keep grounding sections (Root cause, Affected) short/empty when
unknown — they are for grounding, not for guesses.

### Bug

```markdown
## Summary
<one sentence: what goes wrong>

## Environment
- URL/page:
- Role:
- Locale:
- Device/browser (if relevant):

## Steps to reproduce
1.
2.
3.

## Expected
<what should happen>

## Actual
<what happens now>

## Evidence
<screenshot / video / console>

## Root cause (if known)
<file:line + explanation>

## Suggested fix (optional)
<direction>

## Affected
- path/to/file.tsx
```

### Story

```markdown
## User story
As a <role>, I want <goal>, so that <value>.

## Context
<why now / background>

## Acceptance criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

## Out of scope
<what this story explicitly does not cover>

## Notes / touchpoints (optional)
- path/to/area
```

### Task

```markdown
## Goal
<one sentence: the outcome>

## Context
<why this is needed>

## Definition of done
- [ ] <concrete, checkable outcome>

## Touchpoints (optional)
- path/to/file.ts:line
```

## Jira fields

Set only these — keep it minimal:

| Field      | Value                                                       |
| ---------- | ----------------------------------------------------------- |
| project    | `-p <KEY>` from project config (e.g. `RFW`)                 |
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
- **Another project or board** than the configured default: `-p <KEY>` on
  every command; a different board needs its own config (`JIRA_CONFIG_FILE`).

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
- Ground bugs/code-tasks in real code; mark anything unproven as a hypothesis.
- Discover instance-specific ids at runtime; assume nothing is hardcoded.

## Output

- The created issue key and URL.
- A one-line recap of issue type + assignee + sprint.
- Any assumption (e.g. an unconfirmed root cause) the user still needs to verify.
