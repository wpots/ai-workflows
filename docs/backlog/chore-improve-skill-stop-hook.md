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

- [ ] A `hooks` block in `.claude/settings.json` fires on session stop and surfaces the
      `improve-skill` prompt when the run involved corrections, retries, or a failed
      step that needed a workaround.
- [ ] The hook is a reminder, not an autonomous run: it must not edit skills or open
      MRs on its own.
- [ ] It is quiet when nothing needed intervention — no prompt on a clean run.
- [ ] `templates/project-claude-settings.json` carries the same hook, so synced
      projects inherit it.
- [ ] The prose rule stays in place as documentation of intent; the hook is the
      enforcement.
- [ ] Documented in `README.md` next to the existing `scripts/install-hooks.sh`
      pre-commit hook, so both hook kinds are discoverable in one place.

## Technical Notes

This repo currently configures exactly one hook — the git pre-commit hook installed by
`scripts/install-hooks.sh`, which runs the validators. There is no `hooks` block in
`.claude/settings.json` yet, so this adds a second, different kind: a harness hook, not
a git hook. Say which is which in the docs, or the next maintainer will conflate them.

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
