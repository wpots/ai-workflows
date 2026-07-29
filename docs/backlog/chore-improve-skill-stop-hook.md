# Chore: Enforce the improve-skill Retrospective With a Hook

## Status

draft

## Priority

low

## Summary

"After any skill run that required user intervention, run `skills/improve-skill`" is
prose in the generated adapters today, and nothing enforces it. Move the trigger to a
harness-executed hook so the retrospective happens because the tool fires it, not
because the model remembered it.

## User Story

As a maintainer of ai-workflows, I want the retrospective to be triggered by the
harness after a session that needed corrections, so that friction actually gets folded
back into the skill instead of being noticed and forgotten.

## Acceptance Criteria

- [ ] A `Stop` hook joins the existing `hooks` block in
      `templates/project-claude-settings.json` and surfaces the `improve-skill` prompt
      when the run involved corrections, retries, or a failed step that needed a
      workaround.
- [ ] The hook is a reminder, not an autonomous run: it must not edit skills or open
      MRs on its own.
- [ ] It is quiet when nothing needed intervention — no prompt on a clean run.
- [ ] This repo gets the same hook for itself: it ships harness hooks to projects while
      configuring none for its own sessions, which is backwards for the repo where
      workflow friction actually surfaces.
- [ ] The prose rule stays in place as documentation of intent; the hook is the
      enforcement.
- [ ] Documented in `README.md` next to the existing `scripts/install-hooks.sh`
      pre-commit hook, so both hook kinds are discoverable in one place.

## Technical Notes

Two different kinds of hook already exist and are easy to conflate. Say which is which
in the docs:

- a **git** pre-commit hook, installed by `scripts/install-hooks.sh`, which runs the
  validators in this repo;
- five **harness** hooks in `templates/project-claude-settings.json`, shipped to every
  synced project — a migration guard that denies `migrate:fresh`/`migrate:create`, two
  graphify-before-read/grep guards, a sprint-board reminder on MR create and merge, and
  a background graph refresh after edits.

This item adds a sixth harness hook to that block. The migration guard is the precedent
worth studying: it is the only hook that returns a `deny` decision instead of context,
and this one should deliberately *not* — a retrospective prompt must never block a
session from ending.

Use the `update-config` skill to author the settings change rather than hand-editing
JSON, so the hook shape matches what the harness actually expects.

Deciding "did this run need intervention" is the hard part. A conservative trigger that
occasionally asks unnecessarily is better than one that silently never fires; if it
turns out to be noisy, reduce it to a one-line prompt.

## Out of Scope

- Automatically running `skills/improve-skill` end to end.
- Hooks for other workflows (create-pr, run-checks).
- Any change to `scripts/install-hooks.sh`.

## Related

- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../scripts/install-hooks.sh](../../scripts/install-hooks.sh)
- [../../templates/project-claude-settings.json](../../templates/project-claude-settings.json)
- [../pipeline-map.md](../pipeline-map.md)
