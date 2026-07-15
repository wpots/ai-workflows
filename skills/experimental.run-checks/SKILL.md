---
name: run-checks
description: Run project quality checks sequentially, stop on failures for user decision, and summarize results. Use when user asks to run checks, lint/type/test/build pipeline, or validate branch health.
---

# Run Checks Skill

Use this skill when the user asks to run project checks or validate branch quality.

This skill is the canonical workflow source for run-checks on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.

## Workflow

1. Read `package.json` and detect available scripts.
2. Run checks in order: `lint`, `type-check`, `stylelint`, `test`, `build`.
3. Skip missing scripts and report skipped items.
4. If a check fails:
- Show error output and failing command.
- Stop and ask whether to `fix`, `skip`, or `abort`.
5. Continue automatically after successful checks.
6. End with a summary table of pass/fail/skip.

## Constraints

- Do not modify code unless user explicitly asks.
- Do not run fix variants unless user explicitly asks.
- Prefer scripts exactly as defined in `package.json`.

## Sustainable verification

Checks cost compute — run them leanly (sustainable IT):

- Run the **full** pipeline once at a logical boundary (end of a coherent change,
  pre-push, branch validation), not after every edit.
- While iterating, prefer **targeted scopes** — `test <path>`, `lint <files>`,
  `type-check` on demand — and reserve the full sweep for the boundary.
- **Don't re-run a check that already passed** unless the files it covers changed
  since; report "already green, unchanged" instead of re-running.
- **Batch** independent checks into one invocation where the tooling allows it.

This complements the pre-push full sweep in `create-pr` — that sweep is the
single full run; do not duplicate it mid-task.
