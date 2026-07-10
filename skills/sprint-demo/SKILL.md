---
name: sprint-demo
description: Prepare a stakeholder-ready sprint demo by reading the issue tracker for stories on the user's name in the sprint, validating their BLIs are planned for that sprint, and producing a presenter runsheet plus a polished Marp slide deck (and supporting one-pagers where a story needs context). The tracker is read-only. Use when the user asks to prepare a sprint demo, build a demo script, or get ready for sprint review.
---

# Sprint Demo Skill

Use this skill when the user asks to prepare a sprint demo, write a demo script,
or get ready for a stakeholder sprint review.

The canonical step-by-step runbook lives at `commands/sprint-demo.md`. This skill
is a thin wrapper around that runbook so Codex, Cursor, and Claude Code share the
same workflow; Copilot follows the runbook directly.

## Workflow

1. Read `commands/sprint-demo.md` (project root, or the synced `commands/` dir).
2. Follow the phases in order. Do not skip the Phase 8 review pause.
3. A live tracker connection is mandatory (Phase 0). Use the most efficient
   method available: the tracker's MCP connector if connected, otherwise its
   CLI. If neither connects, stop and help the user connect — never prep a demo
   on local docs alone.

## Constraints

- The issue tracker is **read-only**. No comments, transitions, edits,
  assignments, or story points.
- Never run `git commit` — the user commits themselves.
- Only demo stories **on the user's name** (assignee) in the target sprint.
- Validation is tracker-only: confirm each story's BLI is **planned for
  Sprint N**; do not verify code delivery in this flow. Flag mismatches, never
  fix them.
- Audience is **stakeholders** — keep every slide plain-language and value-first;
  technical detail lives only in presenter notes.
- Where a story's value is not self-evident, weave context into the deck or
  generate a supporting one-pager in `docs/demo/sprint-<N>/support/`.
- Stop and ask when a story is ambiguous or you cannot tell what to show; do not
  invent a demo.

## Output

Written to `docs/demo/sprint-<N>/`:

- `demo-script.md` — presenter runsheet (per story: value, environment,
  preconditions, klikpad, timing, fallback, private notes; plus a setup
  checklist and the talk-only items).
- `deck.md` — stakeholder Marp slide deck (value-first slides, klikpad in
  presenter notes). Styling: the Greenberry house-style Marp theme from the
  runbook (paars `#5801FF`, koraal `#FF554E`), with the project logo embedded
  as a base64 data URI on every slide. Render with
  `npx @marp-team/marp-cli docs/demo/sprint-<N>/deck.md --pdf` (or `--pptx`).
- `support/` — optional plain-language one-pagers for stories needing context.
- A list of validation flags (not planned for Sprint N, missing BLI,
  not-yet-done) awaiting a user decision.
