- `dependency-hotfix` reads a release-age gate (pnpm `minimumReleaseAge`, npm
  `min-release-age`). When a critical's fix is younger than the gate, it
  overrides the gate on that one install command, never in the config, and
  names the bypass in the plan and the MR. `npm-maintenance` never overrides
  the gate.
  <!-- slack: Hotfix | Een verse critical-fix komt door de release-age gate, zonder de config aan te passen -->
