- `docs/org-managed-plugin-settings.md` — the org-managed settings now only
  register the `ai-workflows` marketplace with auto-update for every teammate;
  the `greenberry` plugin is no longer force-enabled (no `enabledPlugins`), so
  it stays enabled per project by the synced `.claude/settings.json` and a
  teammate can still disable it. Force-enabling moves to a "Later" section with
  the conditions for revisiting it. The `new-device-setup` runbook and
  `docs/setup-machine.md` follow: with the managed marketplace in place, run
  `/plugin install greenberry@ai-workflows` and skip the auto-update step.
