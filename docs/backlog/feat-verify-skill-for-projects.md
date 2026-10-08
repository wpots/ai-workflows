# Feature: Project-Level `verify` Skill — Checks and Screenshot Evidence Before a Commit

## Status

in-progress

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

- [x] `templates/project-verify-SKILL.md` exists: frontmatter `name: verify` and
      a description that front-loads its trigger ("before committing a code
      change"), no `disable-model-invocation`; the body tells Claude to run the
      project's checks by following `greenberry:run-checks` and the commands in
      the project's `CONVENTIONS.md` `## Scripts`, and to report each command with
      its result, not a summary.
- [x] For a diff that touches UI (components, styles, pages or routes), the
      template tells Claude to pick the browser method by purpose — the browser
      control the session already has first, a browser MCP server (`playwright`,
      `chrome-devtools`) second, never a new Playwright script for a one-off
      check — start the dev server, open each affected route, take a screenshot
      per route and per notable state, and list the screenshot paths in its
      report. With no browser control it says so and marks the UI unverified
      instead of inventing evidence.
- [x] `scripts/sync.sh` project sync copies the template to
      `.claude/skills/verify/SKILL.md` only when that file does not exist, with a
      dry-run line and an "exists (preserved)" line, the same way it treats
      `.claude/settings.json`. The file is project-owned from then on.
- [x] `scripts/smoke-test-project-sync.sh` asserts the file is emitted on a first
      sync, left untouched on a second sync after an edit, and not written by
      `--dry-run`.
- [x] `skills/setup-ai-workflows/SKILL.md` step 8 lists the emission, with the
      same do-not-overwrite rule, and says why it is a project skill and not a
      plugin skill.
- [x] `docs/pipeline-map.md` names the project `verify` skill in the QA phase as
      the producer of screenshot evidence. (The filed item also asked for a link
      from `docs/tooling.md`; dropped, see Technical Notes.)
- [x] `docs/adopt-existing-project.md` and `docs/keep-current.md` list the file
      among the things sync writes once and never overwrites (added at delivery:
      both already list `.claude/settings.json` that way).

## How to verify

Stays `in-progress` until the first check below is ticked: it needs a live Claude
Code session in a scratch project, and the convention it tests is model guidance
that no script can assert.

- [ ] By hand, in a scratch project synced with the new template
      (`./scripts/sync.sh --project <path>`): change a source file, ask Claude to
      commit, and confirm the transcript shows a `Skill` call to `verify` before
      `git commit`; repeat with a docs-only change and confirm it does not run.
      For a UI change, confirm the report lists routes and screenshot paths.
- [x] `bash scripts/smoke-test-project-sync.sh` — passes: the verify skill is
      emitted on a first sync, survives an edit across a second sync (which
      reports "exists (preserved"), and `--dry-run` prints
      `[dry-run] write .claude/skills/verify/SKILL.md` and writes nothing.
- [x] The same script with `scripts/sync.sh` stashed back to `main` — fails at
      "Missing expected path … verify/SKILL.md", so the check fails without the
      change.
- [x] `node scripts/validate-skills.mjs` and `bash scripts/validate-ai-instructions.sh`
      — pass, no adapter drift.

## Technical Notes

Screenshots are evidence for the human, not a baseline. Pixel-diffing against a
Figma frame stays out (`docs/pipeline-map.md`, QA phase: a baseline nobody
maintains). The skill writes screenshots to the system temp directory, outside the
repository, so no project needs a gitignore entry, and reports the paths; how
they reach the MR description is the next slice, and `skills/create-pr` stays
untouched here.

Premise change found at delivery: MR !148 (open when this was built) makes
native browser control the first choice for a one-off UI check, a browser MCP the
fallback, and the project test runner the answer for repeatable regression. The
filed criterion said "when the `playwright` MCP server is available", which that
policy contradicts, so the template chooses the method by purpose and works on
`main` today without depending on `rules/testing.md`. For the same reason the
`docs/tooling.md` link was dropped: !148 rewrites that paragraph and states that
installed Playwright dependencies do not decide the verification method.

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

- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/153
- [feat-verify-before-done.md](feat-verify-before-done.md) (done — evidence-anchored reports in the plugin skills)
- [../../scripts/sync.sh](../../scripts/sync.sh)
- [../../scripts/smoke-test-project-sync.sh](../../scripts/smoke-test-project-sync.sh)
- [../../skills/setup-ai-workflows/SKILL.md](../../skills/setup-ai-workflows/SKILL.md)
- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
- https://code.claude.com/docs/en/skills
