---
name: sprint-demo
description: "Sprint Demo Runbook"
---

# Sprint Demo Runbook

Canonical runbook for preparing a sprint demo for **stakeholders**. The
`sprint-demo` skill on skill-aware tools (Claude, Codex, Cursor) wraps this
runbook; Copilot and other prompt-first tools should follow these steps
directly.

Goal: turn the stories you delivered this sprint into a stakeholder-ready demo —
a presenter runsheet plus a polished Marp slide deck, with supporting one-pagers
where a story needs extra context. The audience is **non-technical**: lead with
value, never with implementation. The issue tracker is read-only throughout —
never edit issues, transitions, or comments.

## Safety

- **Never** mutate the tracker (no comments, transitions, edits, assignments,
  story points).
- **Never** run `git commit` — the user commits themselves.
- Stakeholder-facing: keep every slide plain-language and value-first. All
  technical detail lives in presenter notes, never on a slide.
- Validation is tracker-only — do **not** verify code delivery in this flow.
  Flag mismatches; never fix them.
- Stop and ask when a story is ambiguous or you cannot tell what to show; do not
  invent a demo.

## Inputs

Ask the user at start (one question at a time):

1. Sprint name or id (e.g. `Sprint 7`).
2. Assignee email — whose stories to demo (default: the configured tracker user;
   verify with `jira me`).
3. Tracker project key (infer from backlog filenames, e.g. `RFW`).
4. Demo environment + base URL (e.g. acceptance `https://...`) — where the live
   demo runs.

## Phase 0 — Tracker connection is mandatory

A live tracker connection is a **hard precondition**. Preparing a demo on local
docs alone produces an inaccurate script. Use the **most efficient method
available**:

1. The tracker's **MCP connector** if connected — richest data in one query.
   Preferred.
2. The tracker **CLI** otherwise (e.g. `ankitpokhrel/jira-cli` for Jira — verify
   with `jira me`).

If neither connects, **stop** and help the user connect (MCP: authenticate the
connector; Jira CLI: `brew install ankitpokhrel/jira-cli/jira-cli` then
`jira init`). Never silently fall back to local-only.

## Phase 1 — Fetch the sprint stories on the user's name (read-only)

Query the stories assigned to the user in the target sprint. The assignee filter
is required — only the user's own stories go in the demo.

With the CLI:

```bash
jira sprint list --state active --plain          # confirm the sprint name
jira issue list --plain --no-truncate \
  -a "<assignee-email>" \
  --jql 'sprint = "Sprint 7" AND project = RFW'
jira issue view RFW-XX --plain                    # per-story detail
```

With the MCP, query the same JQL and request status, assignee, issue type,
parent/epic, fixVersion, description, and acceptance criteria.

Capture per story: key, summary, status, issue type, parent/epic, description +
acceptance criteria.

## Phase 2 — Validate BLIs and "planned for Sprint N"

For each story:

1. Locate the BLI: `docs/backlog/<KEY>-*.md` (also check `docs/refine/`,
   `docs/specs/`).
2. Validate the planning marker: the story / BLI is tagged **planned for
   Sprint N** (the agreed sprint label or field). Trust the tracker — no
   code or delivery verification in this flow.
3. Flag, do not fix:
   - story in the sprint but **not** "planned for Sprint N" → planning mismatch.
   - story with **no BLI** → missing doc.
   - BLI present but status not done / ready-to-demo → may not be demoable yet.

Surface all flags to the user before writing the script — these are the items to
confirm or drop.

## Phase 3 — Classify demoable vs. talk-only

Per validated story:

- `demoable` — a visible result a stakeholder can see (UI, flow, content).
- `talk-only` — backend, refactor, infra, or tech-debt: nothing to click.
  Mention it verbally in one line; do not force a screen.
- `needs-context` — demoable, but the value is not obvious without setup or
  background. Flag for Phase 6 support.

## Phase 4 — Order the story (narrative, not ticket number)

Group by theme/epic and order for impact: open with the highest-value or most
visual story, build a logical flow, close with a forward-looking note. Record
dependencies between demos (e.g. "log in as recruiter first").

## Phase 5 — Write the presenter runsheet

Write `docs/demo/sprint-<N>/demo-script.md`. Start with a header section:

- Total demo time (estimates × 1.5 buffer), demo order, and the demo
  environment + URL.
- `talk-only` items — one plain-language line each.
- A combined **setup checklist** gathered across all stories (logins/roles, seed
  data, feature flags, browser state).
- **Mail-flow demos need a working local mailer.** When any story is a
  transactional email / mail flow, the email provider is usually guarded by an
  env check that no-ops outside production. Add a checklist item to make the
  mailer fire locally — typically commenting out that env guard in the provider
  file (e.g. the `sendEmail` vendor file) and pointing it at a local inbox /
  preview — so the emails actually send during the demo. Flag it as a temporary
  local change to revert afterwards; never commit it.

Then, per `demoable` story, a block:

- **Wat** — one-line plain-language description (no jargon).
- **Waarom het telt** — business value for stakeholders (one sentence).
- **Omgeving + URL** — the exact screen to open.
- **Preconditions** — login/role, seed data, feature flags, browser state.
- **Klikpad** — numbered happy-path steps to click through.
- **Tijd** — estimate × 1.5 buffer.
- **Fallback** — screenshot / recording to use if the live path breaks.
- **Notities** — technical caveats the presenter should know but **not** say on
  stage.

## Phase 6 — Story support (weave in or generate docs)

Where a story is `needs-context`, make the value land:

- If a sentence or two fixes it → weave plain-language context into the runsheet
  and the matching deck slide.
- If it needs more → generate a supporting one-pager at
  `docs/demo/sprint-<N>/support/<KEY>-<slug>.md` (e.g. before/after,
  why-this-matters, a simple user flow). Keep it stakeholder-level. Use a
  friendly visual only when a picture genuinely helps — never a raw technical
  diagram.

## Phase 7 — Generate the stakeholder deck (Marp)

Write `docs/demo/sprint-<N>/deck.md` as a Marp deck (markdown):

- Frontmatter: `marp: true` and a theme (the project brand theme if one exists,
  otherwise a clean default).
- Title slide: "Sprint <N> — wat is er nieuw".
- One slide per `demoable` story, grouped by theme: the **headline is the
  value**, with one supporting line and an optional screenshot/visual. No
  implementation detail on slides.
- A closing slide: what's next, plus `talk-only` highlights in one line each.

### Presenter notes = the read-aloud script (most important part)

The notes are what the presenter actually follows live, so write them as a
**read-aloud script with explicit live-demo cues**, never as terse bullets.
Write full, speakable Dutch sentences. Structure every `demoable` slide's
`<!-- ... -->` note in three labelled zones, in this order:

1. `[VOORLEZEN]` — a short paragraph the presenter can read almost verbatim: the
   value for stakeholders, plus the bridge from the previous slide.
2. `🔴 HIER LIVE DEMO — <wat je toont>` — the exact moment to switch to the app,
   followed by a numbered step plan of what to click and show. **Spell out the
   easy-to-forget reveals explicitly** — secondary states, alternate flows,
   optional blocks — so they don't get skipped. Examples of the kind of cue that
   prevents a miss: "laat zien dat je de vacature óók als **concept** kunt
   opslaan", "scroll naar het **nieuwsblok** en toon de doelgroep-checkboxes".
   When in doubt, over-specify: this block is the presenter's only handrail.
3. `[VOORLEZEN]` — an optional one-line wrap or bridge to the next slide.

End with a private `(Niet voorlezen: …)` line for caveats, preconditions, and
fallback the presenter must know but **not** say on stage. `talk-only` slides
get a single `[VOORLEZEN]` paragraph and no live-demo block.

### Render & present with notes

The `<!-- ... -->` presenter notes never render on a slide or in a plain PDF —
they only surface in a presenter view. Explain to the user how to actually use
them, and write a short **"Presenteren met notes"** block into the runsheet
header (Phase 5) so they have it on the day.

Recommended — HTML presenter view, **rendered into the demo folder** so it sits
with the other artefacts:

```bash
npx @marp-team/marp-cli docs/demo/sprint-<N>/deck.md --html -o docs/demo/sprint-<N>/deck.html
```

Open `deck.html` and press `p` (or open `deck.html?view=presenter` in a second
window): the presenter view shows the current + next slide with the read-aloud
script and `🔴 HIER LIVE DEMO` blocks beside them. Generating this `deck.html`
into the demo folder is part of the deliverable when the user is presenting — so
running this one command is expected; other formats only on request.

⚠️ Marp's browser sync can be flaky: it relies on `localStorage`, can break under
tools like VS Code Live Server, and a popup blocker may stop the second window
opening (the current tab then just navigates to `?view=presenter`). If it won't
sync, open the two windows manually and **navigate from the presenter window**
(it's the controller).

Alternatives (only if asked):

- `--pptx -o docs/demo/sprint-<N>/deck.pptx` — notes land in the slide notes
  pane; open in Keynote/PowerPoint for their rock-solid native presenter view.
  Best fallback if the browser sync frustrates.
- `--pdf` — clean slides for the beamer, **no notes**; pair with the runsheet on
  a second device.

**Privacy:** the presenter view is a *separate window*. Notes stay private only
if the user shares the **audience window/tab** (not the whole screen). The plain
`deck.html` / PDF never shows notes, so sharing those is always safe — call this
out explicitly.

### Temporary artefacts — keep them out of git

The whole `docs/demo/` folder is a **throwaway**: it's prep for one demo and gets
deleted afterwards. Make sure `docs/demo/` is in `.gitignore` (add it if not),
and remind the user they can delete the folder once the demo is done. Never
commit demo artefacts.

## Phase 8 — Review pause (stop here)

Print a summary: runsheet path, deck path, support docs created, total demo
time, demo order, and the Phase 2 flags awaiting the user's confirm/drop
decision. Then stop. The docs are the deliverable — do not edit the tracker or
the BLIs.

## Output

End with a concise list of:

- The runsheet path (`docs/demo/sprint-<N>/demo-script.md`).
- The deck path (`docs/demo/sprint-<N>/deck.md`) and the rendered
  `docs/demo/sprint-<N>/deck.html` (presenter view: press `p`).
- Any support one-pagers created under `docs/demo/sprint-<N>/support/`.
- Validation flags (not "planned for Sprint N", missing BLI, not-yet-done) that
  need a user decision.
- `talk-only` stories that will be mentioned but not shown live.
- A reminder that `docs/demo/` is gitignored and throwaway — delete it after the
  demo; revert any temporary local changes (e.g. the mailer env guard).
