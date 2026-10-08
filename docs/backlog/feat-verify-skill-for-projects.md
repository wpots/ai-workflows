# Feature: Project-Level `verify` Skill — Checks and Screenshot Evidence Before a Commit

## Status

ready

Filed 2026-10-08 from the October 2026 stack review (task T18, the visual
verification loop, which was "not started"). What changed since July: Claude
Code v2.1.286 tells Claude to run a skill named `verify` before every commit
except docs-only and tests-only ones. The skill has to be a project skill —
`.claude/skills/verify/`, or `.claude/commands/verify.md` — because plugin skills
do not count (https://code.claude.com/docs/en/skills, checked 2026-10-08). It is
model guidance, not a hard gate.

Premise checks against `main`: nothing emits a project-level skill today (no
`.claude/skills` template; `scripts/sync.sh` copies only `.claude/settings.json`
and the stamp); the Playwright MCP server is written to `.mcp.json` only when
`@playwright/test` is in the project's devDependencies; and no skill or MR
template asks for screenshot evidence, although `docs/pipeline-map.md` names it
"the accepted lighter form" of visual regression.

## Priority

high

## Summary

Emit a thin `verify` skill into every synced project so that Claude runs the
project's checks, and for a UI change takes screenshots, before it commits —
without anyone having to ask. The plugin's `run-checks` stays the source of the
check procedure; the project skill points at it.

## User Story

As a developer on a Greenberry project, I want Claude to check its own work,
and show me the screen for a UI change, before it commits, so that I review
evidence instead of a claim.

## Acceptance Criteria

- [ ] `templates/project-verify-SKILL.md` exists: frontmatter `name: verify` and
      a description that front-loads its trigger ("before committing a code
      change"), no `disable-model-invocation`; the body tells Claude to run the
      project's checks by following `greenberry:run-checks` and the commands in
      the project's `CONVENTIONS.md` `## Scripts`, and to report each command with
      its result, not a summary.
- [ ] For a diff that touches UI (components, styles, pages or routes), the
      template tells Claude, when the `playwright` MCP server is available, to
      start the dev server, open each affected route, take a screenshot per route
      and per notable state, and list the screenshot paths in its report. Without
      the server it says so and skips the step instead of inventing evidence.
- [ ] `scripts/sync.sh` project sync copies the template to
      `.claude/skills/verify/SKILL.md` only when that file does not exist, with a
      dry-run line and an "exists (preserved)" line, the same way it treats
      `.claude/settings.json`. The file is project-owned from then on.
- [ ] `scripts/smoke-test-project-sync.sh` asserts the file is emitted on a first
      sync and left untouched on a second sync after an edit.
- [ ] `skills/setup-ai-workflows/SKILL.md` step 8 lists the emission, with the
      same do-not-overwrite rule, and says why it is a project skill and not a
      plugin skill.
- [ ] `docs/pipeline-map.md` names the project `verify` skill in the QA phase as
      the producer of screenshot evidence, and `docs/tooling.md` links the
      Playwright server to it.

## How to verify

<!-- Filled in by whoever delivers the item. State plainly that the last check
     below is by hand: the convention is model guidance and cannot be unit
     tested. -->

- [ ] `bash scripts/smoke-test-project-sync.sh` — emits and preserves the file.
- [ ] By hand, in a scratch project synced with the new template: change a
      source file, ask Claude to commit, and confirm the transcript shows a
      `Skill` call to `verify` before `git commit`; repeat with a docs-only
      change and confirm it does not run.

## Technical Notes

Screenshots are evidence for the human, not a baseline. Pixel-diffing against a
Figma frame stays out (`docs/pipeline-map.md`, QA phase: a baseline nobody
maintains). Where the screenshots go and how they reach the MR description is the
next slice: have the skill write them to a gitignored folder and report the
paths, and leave `skills/create-pr` untouched here.

The template must stay thin: it points at `greenberry:run-checks` rather than
copying its steps, so the plugin can improve the procedure without a project
re-sync. Stack-specific route detection ("which files are UI") is a few globs
written for the stack `setup-ai-workflows` already detects; do not build a route
resolver.

Do not publish a `verify` skill from `skills/` in the plugin: a plugin skill does
not trigger the commit convention and would only cost listing budget.

## Out of Scope

- Attaching screenshots to the MR or changing `skills/create-pr`.
- Visual regression against a design baseline.
- Changing `.claude/settings.json` handling.
- Updating projects that already have a `.claude/skills/verify/`.

## Related

- [feat-verify-before-done.md](feat-verify-before-done.md) (done — evidence-anchored reports in the plugin skills)
- [../../scripts/sync.sh](../../scripts/sync.sh)
- [../../scripts/smoke-test-project-sync.sh](../../scripts/smoke-test-project-sync.sh)
- [../../skills/setup-ai-workflows/SKILL.md](../../skills/setup-ai-workflows/SKILL.md)
- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../tooling.md](../tooling.md)
- [../pipeline-map.md](../pipeline-map.md)
- https://code.claude.com/docs/en/skills
