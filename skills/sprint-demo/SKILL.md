---
name: sprint-demo
description: Prepare a stakeholder-ready sprint demo from the issue tracker — a presenter runsheet, a Marp deck with read-aloud notes, and, when the client gets a copy, a notes-free pptx in the client's own demo format. Covers the full sprint, the user's own stories, or one shared deck per person; the tracker is read-only. Use when the user asks to prepare a sprint demo, build a demo script, get ready for sprint review, make a shareable demo deck or pptx, or says "demo voorbereiden", "sprint review", "demo delen met de klant".
metadata:
  owner: wieteke.pots
---

# Sprint Demo Skill

Use this skill when the user asks to prepare a sprint demo, write a demo script,
or get ready for a stakeholder sprint review.

The canonical step-by-step runbook lives at `commands/sprint-demo.md`. This skill
is a thin wrapper around that runbook so Codex, Cursor, and Claude Code share the
same workflow; Copilot follows the runbook directly.

## Workflow

1. Read `commands/sprint-demo.md` (project root, or the synced `commands/` dir).
2. Run the intake from its Inputs section before fetching anything: scope
   (full sprint, own stories, per person), the client's previous demo format,
   a shareable version, status and outlook, and the architecture before/after
   when the sprint changed how systems connect.
3. Follow the phases in order. Do not skip the Phase 8 consistency pass and
   review pause.
4. A live tracker connection is mandatory (Phase 0). CLI first: `jira`
   (verify with `jira me`, recipes in `skills/service-cli/references/jira.md`);
   the tracker's connector only when the CLI is not installed and cannot be
   installed now — say so in the recap. If neither connects, stop and help the
   user connect — never prep a demo on local docs alone.

## Constraints

- The issue tracker is **read-only**. No comments, transitions, edits,
  assignments, or story points.
- Never run `git commit` — the user commits themselves.
- The scope is the user's intake choice — full sprint, own stories, or per
  person — never assumed.
- Story validation is tracker-only: confirm each story's BLI is **planned for
  Sprint N**; do not verify code delivery per story. A story created after the
  sprint start is "extra opgeleverd", not a mismatch. Flag mismatches, never
  fix them. The one git check is Phase 8's check of forward-looking claims.
- Never hand out Marp's `--pptx` export: it carries every note. The shareable
  pptx is built on the client's previous deck, without notes.
- The shareable pptx leaves the repo at the final step: the demo-folder copy is
  ignored and `close-sprint` deletes it. Copy it into Google Drive for desktop
  when it is mounted, otherwise into a local folder the user names. Never send
  it through a remote Drive connector, which cannot read the disk.
- Once the user edits `deck.md`, it is the single source: sync the pptx from it
  when they ask, and never regenerate or write to it while they edit.
- Park a slide by moving it to `parked-slides.md`, never by commenting it out:
  its text lands in the presenter notes of the slide before it, even when no
  empty slide shows.
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
- `deck.md` — stakeholder Marp slide deck (value-first slides with
  screenshots and live links, klikpad in presenter notes). Styling: the
  client's previous demo format when there is one, otherwise the Greenberry
  house-style Marp theme from the runbook (paars `#5801FF`, koraal `#FF554E`),
  with the project logo embedded as a base64 data URI on every slide. Render
  to `deck.html` for the presenter view.
- `<client format>.pptx` — when agreed: the shareable version, same slides,
  no notes. Ignored by git; the runsheet header names the Drive or local
  destination it was copied to. `build-pptx.py`, which every sync reruns,
  sits next to it.
- `parked-slides.md` — slides left out of the deck, when there are any.
- `screenshots/` — taken on the demo environment; on the slides and the
  runsheet's fallback.
- `support/` — optional plain-language one-pagers for stories needing context.
- A list of validation and consistency flags (not planned for Sprint N,
  missing BLI, not-yet-done, claims that do not hold) awaiting a user decision.

The folder stays out of git: `.gitignore` carries a folder-wide `docs/demo/`
rule, added when `git check-ignore` finds none, in place of the rendered-file
rules an earlier run added. End by suggesting `close-sprint` after the demo; it
flattens the folder into `docs/sprint-<N>/demo.md`, the only demo record git
keeps, and deletes it. Offer `skills/release-notes` as well: the runsheet's
plain-language lines are one of its sources.
