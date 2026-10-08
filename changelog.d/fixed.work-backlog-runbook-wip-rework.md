- `commands/work-backlog.md` — the fallback runbook's WIP rule said an open MR
  from a previous run means "stop and report", while the skill makes reworking
  that MR's unresolved reviewer comments the run's work. The new
  `work-backlog-3` eval case caught a run quoting the runbook and stopping
  instead of reworking; rule 3 and the WIP-check step now match the skill.
