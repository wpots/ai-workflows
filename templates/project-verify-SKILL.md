---
name: verify
description: Before committing a code change, run the project's quality checks and, when the change touches the UI, open the affected screens in a browser and report what you saw. Use before every commit that changes application code; docs-only and tests-only commits do not need it.
---

# Verify Before Committing

Run this before committing a code change. The output is evidence for the
reviewer: every line names a command that ran or a screen that was opened.

## 1. Run the checks

Follow `greenberry:run-checks`; if that skill is not available, run the
commands under `## Scripts` in `CONVENTIONS.md` yourself, in order (lint,
typecheck, tests, build). Report each as `<command> — <result>`. A step you did
not run is reported as not run, with the reason. A failing check stops the
commit until the user decides.

## 2. Look at the screen, when the diff touches the UI

The diff touches the UI when it changes components, styles, pages or routes
(`## Structure` in `CONVENTIONS.md` says where those live). Otherwise skip this
step.

1. Pick the browser method by purpose: the browser control this session already
   has first (a built-in browser), a browser MCP server (`playwright`,
   `chrome-devtools`) second. Do not write or install a Playwright script for a
   one-off check; an installed Playwright dependency is not a reason to.
2. Start the dev server with the project's dev script, open each affected
   route, and take one screenshot per route and per state the change touches
   (empty, error, loading, a narrow viewport when the diff affects layout).
3. Save the screenshots outside the repository, in the system temp directory,
   and list their paths in the report. Never commit them.

No browser control available: say so in the report and mark the UI as
unverified. Do not describe a screen you did not open.

## 3. Report

- **Checks** — each command and its result.
- **Screens** — each route, the state, what you observed, the screenshot path.
- **Not verified** — anything you could not run or open, and why.

Then commit.

> This file was emitted once by ai-workflows' project sync and is yours to
> edit; later syncs leave it alone.
