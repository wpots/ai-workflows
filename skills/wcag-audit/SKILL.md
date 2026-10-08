---
name: wcag-audit
description: Run a WCAG 2 compliance audit combining a static code review against rules/accessibility.md with an automated axe-core/Playwright scan of the live production (or staging) site, producing one combined report plus backlog-ready findings. Always runs in an isolated worktree so scan tooling never touches the main checkout. Use when the user asks for a WCAG/accessibility compliance audit, an a11y audit of production, or to check the live site against WCAG.
---

# WCAG 2 Compliance Audit

Use this skill when the user asks for a WCAG 2 (2.1/2.2) compliance audit, an
accessibility compliance report, an a11y audit of production, or to check the
live site against WCAG. It combines a static review of the repo's code
against `rules/accessibility.md` with an automated axe-core scan of the
running site, and lands one report plus backlog-ready findings.

Skill-only — no command-runbook fallback. The worktree setup and tool
installation steps don't translate to a prompt-first runbook.

## Contract (read first)

1. **Always runs in an isolated worktree.** This skill installs scan tooling
   (Playwright + axe-core) that must never touch the main checkout's
   `node_modules` or lockfile. Unlike `address-review-comments`, no approval
   pause is needed for the worktree itself — the user has already asked for
   one — but the placement/cleanup safety rules below still apply.
2. **Read-only against the target repo and the target site.** Never edit
   application code, never attempt fixes, never submit forms or mutate state
   on the scanned site. The only writes are the report and (optionally)
   backlog drafts in the main checkout.
3. **One report per run**, covering both sources (code + production), plus
   backlog items for whatever the user wants tracked. No finding is ever
   silently dropped — it's either backlogged or explicitly parked.

## Inputs to Confirm

Ask for whatever can't be inferred — never guess these:

- **Target URL(s) or routes** to scan in production (or staging).
- **WCAG target level** — default **AA** (matches `rules/accessibility.md`);
  confirm if the user wants A-only or AAA included.
- **Branch/commit to audit** in code — default to the current branch; flag
  explicitly if the deployed site is likely ahead of or behind it.
- **Backlog threshold** — which findings become `docs/backlog/` items
  (default: all WCAG A violations + Critical/Serious axe impact; Moderate/
  Minor and AAA nice-to-haves are parked unless the user wants everything
  tracked).

## Context to Load

- `rules/accessibility.md` — the checklist for the static/code pass.
- `CONVENTIONS.md` and `package.json` — package manager, and any a11y
  tooling already in the project (`eslint-plugin-jsx-a11y`, `@axe-core/*`,
  `jest-axe`, Storybook a11y addon).
- `rules/backlog.md` (via the `backlog` skill) for how findings become BLIs.

## Workflow

### 1. Set up the isolated worktree

> ⚠️ Same crash risk as any worktree: the IDE file watcher and TS server will
> index a full duplicate checkout plus its freshly installed `node_modules`.
>
> - Place it **outside** the workspace root and outside every harness
>   `additionalDirectories` entry — prefer `~/.worktrees/<repo>-wcag-audit`.
>   Never under `.claude/worktrees/`, `.worktrees/`, or any path inside the
>   open workspace/repo.
> - Offer a separate IDE window (`code -n <path>`) rather than switching the
>   main window into it.
> - Base it on the branch/commit being audited (default: current branch).
> - Use the **EnterWorktree** tool once it's created so it becomes a
>   registered working directory for the install/build/scan commands below —
>   avoids a per-command approval prompt for every `cd`.
> - Copy local env files needed to build/run the app from the main worktree,
>   install dependencies, and run any codegen step the project requires —
>   `skills/create-pr/references/worktrees.md` has the dependency and
>   gitignored-artifact rules.
> - **Remove the worktree** (`git worktree remove --force <path>`) once the
>   report and backlog items are written to the main checkout — its only
>   purpose is scan-tooling isolation; nothing should be left uncommitted
>   there.

### 2. Static code audit (in the worktree)

- Walk the checklist in `rules/accessibility.md` against the app's
  components/pages: semantic HTML, labeling, keyboard operability, focus
  management, ARIA state, heading hierarchy, color-only signaling, touch
  target size, `prefers-reduced-motion`, zoom/reflow.
- Reuse existing project tooling instead of re-deriving it: run `eslint` if
  `eslint-plugin-jsx-a11y` is configured, or existing `jest-axe`/Storybook a11y
  checks. Do not add lint plugins the project doesn't already use.
- Map every finding to a concrete WCAG 2 success criterion (e.g. "1.1.1
  Non-text Content", "2.4.6 Headings and Labels") and level (A/AA/AAA).

### 3. Production audit (in the worktree)

- Check whether `playwright` + `@axe-core/playwright` (or an equivalent —
  `pa11y`, `jest-axe` wired for live URLs) are already project dependencies.
- Prefer a one-off/`dlx`-style run (`npx`, `pnpm dlx`, `yarn dlx`) so nothing
  touches `package.json`. If the package manager has no such mode, install
  ephemerally (e.g. `npm install --no-save`) and do not commit the resulting
  lockfile change.
- Install the Playwright browser binary if missing
  (`npx playwright install --with-deps chromium`).
- Write the scan script to a file (scratchpad or the worktree) with the
  Write tool and run it with `node <script>` — never inline a multi-line
  script as a Bash heredoc.
- For each confirmed URL/route: navigate, run axe-core scoped to the
  confirmed WCAG tags (`wcag2a`, `wcag2aa`, `wcag2aaa` as applicable), and
  capture violations (impact, WCAG tags, target selector, help text,
  affected node count).
- Never scan authenticated flows, submit forms, or trigger destructive
  actions unless the user explicitly provided credentials/consent for that
  route.
- If the deployed markup differs meaningfully from the audited branch's
  source for the same finding, say so explicitly rather than presenting them
  as identical.

### 4. Merge and rank findings

- Combine code + production findings; dedupe when the same underlying issue
  shows up in both (cite both locations).
- Rank by WCAG level first (A > AA > AAA), then by axe impact
  (Critical > Serious > Moderate > Minor) or manual-review severity.

### 5. Write the report

Save to `docs/audits/wcag-audit-<date>.md` in the **main checkout** (not the
worktree). Structure:

- **Summary** — counts by level and impact, URLs/routes scanned, WCAG target
  level, branch/commit audited.
- **Findings** — per item: WCAG criterion + level · source (code/production/
  both) · location (`file:line` or URL + selector) · impact · fix.
- **Already compliant** — notable patterns worth keeping as-is.
- **Quick wins** vs **Needs design/team alignment**.
- **Parked** — findings below the backlog threshold, explicitly listed.

### 6. Draft backlog items

For findings at/above the confirmed threshold, hand off to the `backlog`
skill (one item per finding or per related group) so they land in
`docs/backlog/` using the project's real template — don't reinvent the BLI
format here.

### 7. Report back

State: worktree path (now removed), report path, backlog items created, scan
tool versions used, and anything skipped (auth-gated routes, missing tooling,
deploy/branch mismatch).

## Constraints

- Never modify application code, attempt automated fixes, or submit forms /
  mutate state on the scanned site.
- Never add new lint plugins or dependencies to the project's real
  `package.json` just for this audit — ephemeral/`dlx` installs only.
- Never skip the worktree, even for a code-only or production-only pass.
- Every finding must cite a concrete WCAG 2 success criterion and level, not
  just "accessibility issue."
- No finding may be silently dropped — always backlogged or parked visibly.

## Anti-Patterns

- ❌ Guessing the production URL instead of asking.
- ❌ Treating an axe/Lighthouse score alone as "compliant" without
  criterion-level detail.
- ❌ Auditing only the code or only production when the user asked for both.
- ❌ Leaving the ephemeral Playwright/axe install in the project's real
  `package.json`/lockfile.
- ❌ A report with no backlog items and no explicit parked list.

## Example Prompt

> "Run a WCAG 2 AA audit on the current branch and https://example.com —
> combine code and production findings into one report, and backlog anything
> Serious or worse."
