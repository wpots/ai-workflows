---
name: improve-skill
description: Post-run retrospective for any skill or command. Collects friction from the session (user interventions, corrections, failed commands, retries) and folds durable learnings back into the skill's canonical source so the next run needs less hand-holding, decides whether a recurring pattern deserves a new skill, an update, or a lighter surface, and authors the new skill when one is warranted. Runs automatically after any skill run that required user intervention. Use when a skill or command run needed correction, its canonical source should absorb the learnings, a new skill should be created, or the user asks to learn from sessions, spot workflow patterns, evaluate a skill opportunity, or decide whether something should be a skill.
metadata:
  owner: wieteke.pots
---

# Improve Workflow Skills

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
   `<ai-workflows>/skills/<name>/SKILL.md`, with
   `<ai-workflows>/commands/<name>.md` as the fallback runbook. `<ai-workflows>`
   is your local clone of `greenberrynl/config/ai-workflows`, `~/Web/ai-workflows`
   by default; when it is not there, ask for the path. Never edit the plugin
   cache copy: an update replaces it. Project sync copies these outward —
   always edit the ai-workflows source, never only a synced copy.
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
   Some learnings rest on an outside fact: a tool flag, a platform limit, a
   version, a branch or release line, a sandbox rule. Such a learning names,
   in the same sentence:
   - the fact it rests on;
   - when that fact was checked;
   - what would make the learning false.
   For example: "`glab mr create` cannot take a body file; holds while glab
   has no `--description-file` (checked 2026-10)". A learning about the repo's
   own conventions is permanent and needs no condition.
4. **Apply minimal edits** to the skill source: extend existing sections
   before adding new ones, keep the skill terse, and update the frontmatter
   `description` if the skill's scope grew. First read the existing pitfalls
   in the area you edit. When a pitfall's stated condition visibly no longer
   holds, remove that pitfall in the same edit, and name the removal in the
   report. If the fallback command runbook
   exists and now materially diverges, give it a compact version of the same
   change. Editing `commands/<name>.md` changes its generated Copilot adapter
   `.github/prompts/<name>.prompt.md`: the pre-commit hook regenerates it and
   blocks the commit until the regenerated file is staged — `git add -A` and
   commit again; never hand-edit the adapter. The edit lands in `ai-workflows`
   through a GitLab MR, never on `main`: read
   `skills/upstream-rules/references/upstream-mr.md` before branching.
5. **Add a compound artifact only when it can fail without the fix.** The
   prose edit is the default, and most learnings need nothing more:
   - **a check** — only when the wrong text was in a skill, command or rule
     and could come back there: a `scripts/validate-skills.mjs` block, a lint
     rule, a hook, or a CI step. A check over files cannot catch a model that
     improvised a wrong command those files never contained.
   - **an eval** — only when the skill's own text led the run the wrong way.
     Add a case under `evals/<name>/` (`prompt.md` plus `graders/`; layout and
     run command in `evals/README.md`), and keep it only after watching it
     fail on the base. Apply that README's targeted-case selection and budget
     policy to both the baseline and fixed run; a retrospective does not
     authorize a whole suite or extra repetitions.
   - **a solution note** — when the learning is project-specific (belongs to
     that codebase, not the shared skill), write
     `docs/solutions/<slug>.md` in the project: symptom, root cause, fix,
     prevention, retire when — one page. `backlog`, `refinement`, and `work-backlog` read
     that folder as grounding, so the lesson resurfaces at planning time
     instead of being relearned.
6. **Update intent mappings** when new trigger phrases surfaced this session:
   the skill's row in `<ai-workflows>/shared/skill-mappings.md`, or its row in
   `shared/command-mappings.md` for a command without a skill (that row is also
   copied verbatim into the `## Command Mapping` section of `CLAUDE.md`).
   `scripts/generate-adapters.sh` injects the fragments into the adapters;
   never edit the generated blocks or the synced
   `~/.claude/rules/ai-workflows.md`.
7. **Report once**: which files changed and the learnings captured, one line
   per learning. Each line gives:
   - the learning's retirement condition from step 3, or "permanent" for a
     convention;
   - which compound artifacts (check/eval/solution note) it produced.
   Then list any pitfall removed under step 4.

## Deciding Whether a Skill Is Warranted

Turn session evidence into one of four recommendations: no new asset, update an
existing skill, create a new skill, or use a lighter surface. Ground the
decision in repeated friction, not in a single interesting task; when the only
evidence is the current session, say the confidence is low.

Create or update a skill when at least three of these hold:

- the workflow appeared in multiple sessions, or will clearly recur
- success depends on procedural steps that are easy to forget or reorder
- the task needs repo, domain, or tool knowledge general reasoning lacks
- the agent repeatedly asks the same questions or misses the same constraint
- the workflow benefits from bundled references, scripts, or templates
- outcome quality depends on validation steps or stopping points
- the workflow must be shared across tools (Claude, Copilot, Codex)

Pick the smallest durable surface, in this order: existing-skill update → new
skill → command/runbook → rule → project documentation → nothing. Do not
create for one-offs, for patterns still too vague for a concrete example, or
for anything a lint/validation rule can enforce instead — and never duplicate
an existing skill under a slightly different name: every skill description
loads into every session and competes with all others for routing, so each
addition taxes routing accuracy everywhere.

When recommending without implementing, output a short brief: decision,
confidence, candidate name, trigger description, 4-8 workflow steps,
resources, adapters, validation, risks.

## Creating a New Skill

The workflow above folds learnings into an *existing* skill. When the session
surfaced a genuinely new, reusable technique that no skill covers, author a new one
in `<ai-workflows>/skills/<name>/SKILL.md`. Adapted from obra/superpowers'
`writing-skills` — creating a skill is TDD for process documentation.

**Create only when** the technique wasn't obvious, you'd reference it again across
projects, and it isn't already documented elsewhere. Don't create for one-offs,
project-specific conventions (those go in the project's own instructions/rules), or
anything enforceable with a lint/validation rule (automate it instead).

**Iron law: no skill without watching it fail first.** Before writing, confirm the
baseline actually fails — an agent (or you) handling the situation *without* the skill
does the wrong thing. If the no-guidance baseline already does the right thing, there's
nothing to write. This applies to edits too, not just new skills. Watch it before
merge, not after a release: run the same selected case once on the base and
once on your branch, using the checkout's plugin and the selection, cost and
permission policy in `evals/README.md`. A declined paid run is reported as
not run; it is not replaced with an uncapped direct prompt.

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
- [ ] Frontmatter ends with `metadata:` and an indented `owner: <gitlab username>`
      (`wieteke.pots` for now) — the validator errors without it
- [ ] Overview states the core principle in 1-2 sentences
- [ ] Guidance form matches the failure type (table above)
- [ ] One excellent, real example — not multi-language, not a fill-in template
- [ ] Defers to existing `rules/` for policy instead of restating it
- [ ] Cross-references sibling skills by name (no `@` links — they force-load context)
- [ ] Rationalization table + red-flags list (discipline skills only)
- [ ] Registered: `docs/workflow-canonical-sources.md` inventory row, and an intent
      line in `shared/skill-mappings.md` (the validator fails on a skill without one)
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
