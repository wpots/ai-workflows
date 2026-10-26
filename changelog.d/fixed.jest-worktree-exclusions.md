- Preserve project-specific Jest exclusions and coverage when running checks
  from worktrees, so Playwright specs stay out of the Jest suite.
- After a hotfix rehearsal on acceptance, restore acceptance ancestry in
  development without changing its files, so the next promotion can fast-forward.
