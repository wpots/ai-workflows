---
name: jira-ticket
description: Create a Jira issue (bug, story, or task) from a consistent, type-specific template — gather the facts, ground it in the codebase where relevant, then create the issue with assignee and sprint after confirmation. Writes to the tracker. Project-agnostic: discover instance ids at runtime. Use when the user asks to file, log, create, or open a Jira ticket / bug / story / task (e.g. "maak een jira ticket", "file a story", "meld een bug", "create a task").
---

# Jira Ticket Skill

Use this skill when the user asks to create **any** Jira issue — a bug, a user
story, or a task. It **writes** to the tracker (creates one issue).

The goal: every ticket lands in Jira with a predictable, type-appropriate
template, so a developer can pick it up directly. The skill is project-agnostic —
resolve every instance-specific value at runtime rather than assuming it.

## Tracker write — safety

- This skill creates a Jira issue. **Always confirm the issue type, summary,
  assignee, and sprint with the user before calling `createJiraIssue`.**
- Never transition, comment on, or edit existing issues unless explicitly asked.
- Create exactly one issue per request. Do not batch-create without approval.

## Step 0 — Determine the issue type

Pick from the user's intent:

- **Bug** — something is broken. Needs a reproduction path.
- **Story** — user-facing capability / feature. Needs value + acceptance criteria.
- **Task** — technical/chore work with no direct user story (refactor, config,
  spike, docs).

If the type is ambiguous, ask. The type drives the template (below) and the
issue-type id.

## Context to load

1. The project's tracker key (e.g. `RFW`, `ACME`). Look in `CONVENTIONS.md`,
   `README`, or infer from the branch prefix (`RFW-158`). Do **not** hardcode it.
2. For **bugs** and code-grounded **tasks**: the relevant source files, so the
   root cause / touchpoints are grounded and not guessed. For **stories**: the
   feature area, enough to write realistic acceptance criteria.

Jira connection values (cloudId, issue-type ids, sprint field id) are
**instance-specific — discover them at runtime.** See "Jira gotchas".

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
   - `cloudId` → `getAccessibleAtlassianResources`.
   - Project key → from step "Context to load".
   - Issue type → pass `issueTypeName` (`"Bug"` / `"Story"` / `"Task"`). If the
     name is rejected, resolve the numeric id via
     `getJiraProjectIssueTypesMetadata`.
   - Assignee → `lookupJiraAccountId`. If more than one match, confirm the exact
     person before using the `accountId`.
   - Sprint (optional) → resolve the **numeric sprint id** and the **sprint field
     key** (see gotchas). Skip for backlog tickets.
4. **Write the body** using the matching template. Match the language and
   English/native-term mix of the project's existing tickets. Use
   `contentFormat: "markdown"`.
5. **Confirm, then create.** Show the user: issue type + summary + assignee +
   sprint + project. On approval, call `createJiraIssue`.
6. **Report back** the issue key and `webUrl`.

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
| project    | tracker key from project config (e.g. `RFW`)                |
| issue type | `Bug` / `Story` / `Task`                                    |
| assignee   | resolved `accountId` (confirm the person first)             |
| sprint     | numeric sprint id via the sprint field key (optional)       |

No priority, labels, components, or reporter overrides unless the user asks.

## Jira gotchas

Instance ids drift and differ per Jira site — **discover, don't assume.**

- **cloudId** → `getAccessibleAtlassianResources`. Cache it per session only.
- **Project + issue-type ids** → `getJiraProjectIssueTypesMetadata` for the
  project key. Prefer passing `issueTypeName`; fall back to the numeric id only
  if the name is rejected.
- **Sprint field key is not universal.** The default `customfield_10020` returns
  `null` on some instances even for issues that are in a sprint; another key
  (e.g. `customfield_10021`) may hold it. Discover the real one by querying an
  issue already in the target sprint (`fields: ["*all"]`) and reading which
  custom field carries the sprint object.
- **Sprint value is the numeric sprint id**, not the sprint object, e.g.
  `additional_fields: { "<sprintFieldKey>": 1545 }`.
- **Finding the sprint id**: `searchJiraIssuesUsingJql`,
  jql `project = <KEY> AND sprint = "Sprint N"`, `fields: ["*all"]`,
  `maxResults: 1`; read the sprint object's `id`. JQL matches the short name even
  when the real name is prefixed. The `*all` response is large — do this in a
  subagent that returns only the field key + sprint id.

## Constraints

- Confirm before creating. One issue per request.
- Ground bugs/code-tasks in real code; mark anything unproven as a hypothesis.
- Discover instance-specific ids at runtime; assume nothing is hardcoded.

## Output

- The created issue key and `webUrl`.
- A one-line recap of issue type + assignee + sprint.
- Any assumption (e.g. an unconfirmed root cause) the user still needs to verify.
