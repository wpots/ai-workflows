- `greenberry:<skill>` loads the skill again for the 14 skills that also have a
  runbook in `commands/` (backlog, create-pr, work-backlog, sprint-planning,
  refinement, close-sprint and eight more). Claude Code registered every runbook
  as a plugin command, and a command named like a skill shadowed it: the Skill
  tool handed out the fallback runbook instead of `SKILL.md`, so whatever only
  the skill says never loaded. The plugin now registers only the runbooks no
  skill covers (`new-device-setup`, `safe-kill-port`); `/greenberry:review-code`
  is gone, `/greenberry:code-review` is the skill. `validate-skills.mjs` errors
  when a registered command shares a skill's name.
  <!-- slack: Skills zoals backlog, create-pr en work-backlog laden weer hun eigen instructies in plaats van de fallback-runbook -->
