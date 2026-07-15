---
name: improve-skill
description: Post-run retrospective for any skill or command. Collects friction from the session (user interventions, corrections, failed commands, retries) and folds durable learnings back into the skill's canonical source so the next run needs less hand-holding. Runs automatically after any skill run that required user intervention.
---

# Improve Skill

A meta-skill: after another skill, command, or runbook has run, capture what
went wrong or needed the user's help, and edit that skill's source so the next
run is more autonomous.

## When to Run

Run automatically — without being asked — at the end of any skill/command run
where at least one of these happened:

- the user corrected course, re-explained intent, or had to give a go-ahead
  the skill should have defined upfront
- a command or API call failed and a workaround was found
- a step needed knowledge that was discovered during the run (flags, API
  shapes, line-number math, escaping pitfalls)
- the user explicitly asks ("improve skill", "take learnings", "verbeter je
  skill")

If a run had zero friction, skip silently — do not touch the skill.

## Workflow

1. **Identify the skill that ran** and locate its canonical source:
   `~/Web/ai-workflows/skills/<name>/SKILL.md`, with
   `~/Web/ai-workflows/commands/<name>.md` as the fallback runbook. Project
   sync copies these outward — always edit the ai-workflows source, never only
   a synced copy.
2. **List the frictions** from the session, concretely: each user
   intervention, each failed command paired with the fix that worked, each
   assumption that turned out wrong.
3. **Filter to durable learnings.** Keep:
   - working mechanics (exact commands, flags, payload shapes, verification
     steps)
   - autonomy rules: what a single user go-ahead covers, so the skill never
     re-asks mid-batch
   - pitfalls, phrased as "never do X — it fails like Y; do Z instead"
   Drop anything session-specific (repo names, MR numbers, one-off context).
4. **Apply minimal edits** to the skill source: extend existing sections
   before adding new ones, keep the skill terse, and update the frontmatter
   `description` if the skill's scope grew. If the fallback command runbook
   exists and now materially diverges, give it a compact version of the same
   change.
5. **Update intent mappings** when new trigger phrases surfaced this session:
   the `## Command Mapping` section in `~/Web/ai-workflows/CLAUDE.md` (source)
   and the synced `~/.claude/CLAUDE.md`.
6. **Report once**: which files changed and the learnings captured, one line
   per learning.

## Constraints

- Every learning must trace to something that actually happened in the
  session — no speculative features.
- Do not rewrite or restructure a skill wholesale; smallest durable edit wins.
- Workflow mechanics belong in the skill; user preferences about tone or
  process belong in memory, not in skill files.
- Never weaken safety constraints (confirmation before destructive or
  outward-facing actions) — autonomy improvements apply after the user's go,
  not instead of it.
