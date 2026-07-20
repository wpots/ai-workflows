---
name: improve-skill
description: Post-run retrospective for any skill or command. Collects friction from the session (user interventions, corrections, failed commands, retries) and folds durable learnings back into the skill's canonical source so the next run needs less hand-holding, and authors a new skill when the session surfaced a reusable technique none covers. Runs automatically after any skill run that required user intervention. Use when a skill or command run needed correction, its canonical source should absorb the learnings, or a new skill should be created.
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

## Creating a New Skill

The workflow above folds learnings into an *existing* skill. When the session
surfaced a genuinely new, reusable technique that no skill covers, author a new one
in `~/Web/ai-workflows/skills/<name>/SKILL.md`. Adapted from obra/superpowers'
`writing-skills` — creating a skill is TDD for process documentation.

**Create only when** the technique wasn't obvious, you'd reference it again across
projects, and it isn't already documented elsewhere. Don't create for one-offs,
project-specific conventions (those go in the project's own instructions/rules), or
anything enforceable with a lint/validation rule (automate it instead).

**Iron law: no skill without watching it fail first.** Before writing, confirm the
baseline actually fails — an agent (or you) handling the situation *without* the skill
does the wrong thing. If the no-guidance baseline already does the right thing, there's
nothing to write. This applies to edits too, not just new skills.

**Match the form to the failure** — the wrong form measurably backfires:

| Baseline failure | Right form |
|---|---|
| Knows the rule, skips it under pressure | Prohibition + rationalization table + red-flags list |
| Complies but output has the wrong shape | Positive recipe: state what the output IS, its parts in order |
| Omits a required element it already produces | Structural: a REQUIRED field/slot in the template |
| Behavior should depend on a condition | Conditional keyed to an observable predicate |

Don't reach for prohibitions on shaping problems — under a competing incentive, agents
negotiate with "don't X". A recipe leaves nothing to negotiate. No nuance clauses
("don't X unless…") — express a real exception as its own conditional.

**Description field = triggers, not workflow.** Write it in third person, start with
what it does then "Use when…" (match sibling skills). NEVER summarize the skill's
steps in the description — agents follow the description's summary instead of reading
the body. Pack in keywords an agent (or the user, in Dutch or English) would search
for: symptoms, error strings, synonyms, tool names.

**Creation checklist:**
- [ ] Confirmed the no-guidance baseline actually fails (RED)
- [ ] `name` is letters/numbers/hyphens only and matches the directory name
- [ ] Frontmatter has `name` + `description`; description is triggers, not workflow
- [ ] Overview states the core principle in 1-2 sentences
- [ ] Guidance form matches the failure type (table above)
- [ ] One excellent, real example — not multi-language, not a fill-in template
- [ ] Defers to existing `rules/` for policy instead of restating it
- [ ] Cross-references sibling skills by name (no `@` links — they force-load context)
- [ ] Rationalization table + red-flags list (discipline skills only)
- [ ] Registered: `docs/workflow-canonical-sources.md` inventory row, and an intent
      line in the `## Command Mapping` section of `CLAUDE.md` if it needs routing
- [ ] `node scripts/validate-skills.mjs` passes (stage the new files first — the
      validator only sees git-tracked files)

## Constraints

- Every learning must trace to something that actually happened in the
  session — no speculative features.
- Do not rewrite or restructure a skill wholesale; smallest durable edit wins.
- Workflow mechanics belong in the skill; user preferences about tone or
  process belong in memory, not in skill files.
- Never weaken safety constraints (confirmation before destructive or
  outward-facing actions) — autonomy improvements apply after the user's go,
  not instead of it.
