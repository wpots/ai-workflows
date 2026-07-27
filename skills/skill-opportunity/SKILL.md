---
name: skill-opportunity
description: Decide from prior or current working sessions whether a new skill or an update to an existing skill would be useful. Use when the user asks to learn from sessions, spot repeated workflow patterns, improve AI workflows, create a reusable skill from recurring work, evaluate whether a task deserves a skill, or make Codex/Copilot/Cursor/Claude guidance more reusable.
---

# Skill Opportunity

## Overview

Use this skill to turn session evidence into a concrete recommendation: no
skill, update an existing skill, create a new skill, or use a lighter-weight
runbook/rule/prompt instead. Keep the decision grounded in repeated friction,
not in a single interesting task.

## Inputs

Accept any available evidence, for example:

- the current conversation
- recent session summaries or notes
- repeated user corrections or preferences
- recurring command sequences, file edits, review steps, or external tool use
- existing skills, commands, rules, prompts, or adapters in the repo

If session history is unavailable, work from the current session and say the
recommendation has lower confidence.

## Decision Workflow

1. Inventory existing workflow surfaces first: project skills, commands,
   prompts, rules, and tool adapters. Prefer updating an existing surface when
   the new pattern is an extension of that workflow.
2. Extract 3-7 concrete signals from the session evidence. Focus on repeated
   work, repeated mistakes, repeated questions, or repeated tool choreography.
3. Score the opportunity with the rubric below.
4. Recommend the smallest durable workflow surface that solves the problem.
5. If a skill is justified, produce a concise skill brief that can be handed to
   a skill-creation workflow.

## Skill Justification Rubric

Create or update a skill when at least three of these are true:

- The same workflow has appeared in multiple sessions or is expected to recur.
- Success depends on procedural steps that are easy to forget or reorder.
- The task needs specific repo, domain, product, or tool knowledge that is not
  obvious from general reasoning.
- The agent repeatedly asks the same clarifying questions or misses the same
  constraint.
- The workflow benefits from bundled references, scripts, templates, or assets.
- The outcome quality depends on validation steps or stopping points.
- The workflow should be shared across Codex, Copilot, Cursor, Claude, or other
  agents.

Do not create a skill when:

- the task is a one-off
- a short rule, checklist, command, or prompt wrapper is enough
- the missing knowledge belongs in project docs, product docs, or code comments
- the pattern is still vague and lacks concrete examples
- the change would duplicate an existing skill with a slightly different name

## Surface Selection

Use this order:

1. **Existing skill update** when an active reusable workflow already covers the
   same intent.
2. **New skill** when the workflow is repeatable, multi-step, and benefits from
   procedural guidance or bundled resources.
3. **Command/runbook** when prompt-first tools need a fallback or the workflow is
   mostly a checklist.
4. **Rule** when the output is an always-on coding or review standard.
5. **Project documentation** when humans need the knowledge as much as agents do.
6. **No new asset** when the session reveals no durable pattern.

## Cross-Tool Packaging

When the recommendation must work across tools:

- Put the canonical workflow in `skills/<name>/SKILL.md` for skill-aware tools.
- Add or update a matching `commands/<name>.md` when Copilot or prompt-first
  usage needs a fallback.
- Add a `.github/prompts/<name>.prompt.md` wrapper when Copilot should expose the
  workflow as an attachable prompt.
- Update the relevant dispatch/adapters only when the trigger should be
  discoverable from normal user phrasing.
- Keep the canonical logic in one place and make adapters thin pointers.

## Skill Brief Format

When a new or updated skill is justified, output:

- **Decision:** create / update / do not create
- **Confidence:** high / medium / low, with the evidence limit if relevant
- **Candidate name:** lowercase hyphen-case
- **Trigger description:** the frontmatter-style sentence that explains when to
  use it
- **Workflow:** 4-8 ordered steps
- **Resources:** scripts, references, assets, or none
- **Adapters:** which tools need command, prompt, or adapter updates
- **Validation:** how to check the skill or workflow works
- **Risks:** duplication, overfitting, missing examples, or unclear ownership

If the decision is "do not create", explain the lighter alternative in one or
two sentences.

## Constraints

- Do not invent session history. Label assumptions and confidence clearly.
- Do not treat user frustration alone as evidence; tie it to a repeatable
  workflow or missing reusable context.
- Do not create files unless the user asked for implementation.
- Keep proposed skills narrow enough to trigger reliably.
- Prefer improving shared workflow assets upstream when the pattern is reusable
  beyond the current repo.
