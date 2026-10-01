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
- Story validation is tracker-only — do **not** verify code delivery per story.
  Flag mismatches; never fix them. The one git check is the Phase 8 check of
  forward-looking claims.
- Stop and ask when a story is ambiguous or you cannot tell what to show; do not
  invent a demo.

## Inputs

Ask at start, in one batch where the tool allows several questions (otherwise
one at a time). Skip a question the repo or tracker already answers.

1. Sprint name or id (e.g. `Sprint 7`).
2. Tracker project key (infer from backlog filenames, e.g. `RFW`).
3. Demo environment + base URL (e.g. acceptance `https://...`) — where the live
   demo runs.
4. **Scope** — whose work goes in:
   - the full sprint (team demo);
   - only the user's stories (assignee = the configured tracker user; verify
     with `jira me`);
   - per person — one deck with a section per assignee, so the developers
     share one demo and each presents their own part.
5. **Format** — is there a previous demo deck the client normally works with
   (often a `.pptx` in Downloads or on a shared drive)? If so, it sets the slide
   sequence and the look (Phase 7); the Greenberry theme is the fallback.
6. **Shareable version** — does the client get a copy? Then a notes-free
   `.pptx` is part of the deliverable (Phase 7, "Shareable version").
7. **Status and outlook** — a status/velocity slide, and a look ahead at the
   next sprint? When the tracker has no points or hours, say so: a slide of
   `[..]` placeholders is only worth keeping when the user will fill it in.
8. **Architecture before/after** — ask only when the sprint changed how systems
   connect (a new integration, a vendor swap, a new layer) or the sprint docs
   hold a diagram (`*.drawio`, `docs/sprint*/`, `docs/architecture*`).

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

## Phase 1 — Fetch the sprint's stories (read-only)

Query the stories in the target sprint. Filter on assignee only when the intake
scope is the user's own stories; for the per-person scope, group by assignee.

With the CLI:

```bash
jira sprint list --state active --plain          # sprint name, start and end
jira issue list --plain --no-truncate \
  -a "<assignee-email>" \
  --jql 'sprint = "Sprint 7" AND project = RFW'   # -a only for own-stories scope
jira issue view RFW-XX --plain                    # per-story detail
```

With the MCP, query the same JQL and request status, assignee, issue type,
parent/epic, fixVersion, created, description, and acceptance criteria.

Capture per story: key, summary, status, issue type, parent/epic, assignee,
**created date**, description + acceptance criteria — plus the sprint's start
and end dates.

## Phase 2 — Validate BLIs and "planned for Sprint N"

For each story:

1. Locate the BLI: `docs/backlog/<KEY>-*.md` (also check `docs/refine/`,
   `docs/specs/`).
2. Validate the planning marker: the story / BLI is tagged **planned for
   Sprint N** (the agreed sprint label or field). Trust the tracker — no
   code or delivery verification in this flow.
3. Split planned from extra: a story **created after the sprint start** was
   picked up during the sprint. That is not a mismatch to drop — it is "extra
   opgeleverd" and gets its own table next to the planned work on the scope
   slide (Phase 7).
4. Collect the findings the sprint surfaced but did not fix — issues created
   during the sprint that are not in it (`project = RFW AND created >= <start>
   AND sprint is EMPTY`) — for the backlog-findings slide.
5. Flag, do not fix:
   - story created before the sprint start but **not** "planned for Sprint N"
     → planning mismatch.
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
  data, feature flags, browser state). Include a rehearsal of every URL **one at
  a time** when the demo environment sits behind a rate limiter.
- **Vragen die je kunt verwachten** — a question/answer table for what
  stakeholders will ask: test data versus production, features that are
  missing on purpose, differences with the current site.
- Numbers you quote (result counts, "aanwezig in 27 locaties") are measured on
  the demo environment and carry their date ("op 29-09: 250"), since test data
  drifts. Never estimate them.
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

- Frontmatter: `marp: true` + a theme. **When the client has a previous demo
  deck (intake 5), match it**: its slide sequence, section slides, fixed
  labels, fonts and colours, rebuilt as Marp classes (`<!-- _class: … -->`).
  Otherwise use the **Greenberry house-style theme** below.
- **Project logo on every slide**: find the project's logo in the repo (often
  an SVG inside a `Logo` React component — extract the `<svg>` markup to a
  standalone `.svg` next to the deck), then embed it as a **base64 `data:`
  URI** in the theme CSS. Never reference the logo by relative path — PNG/PDF
  export and moved files break relative `url()`s silently.

  ```yaml
  marp: true
  theme: default
  paginate: true
  style: |
    /* Greenberry huisstijl (greenberry.nl): paars #5801FF, koraal #FF554E,
       antraciet #32323C, lime #DBFF00; koppen Modernmtstd, mono Courier Std. */
    section {
      font-family: "Segoe UI", "Avenir Next", Arial, sans-serif;
      background: #fafafa;
      color: #32323c;
      padding: 64px 64px 56px;
    }
    h1, h2 {
      font-family: Modernmtstd, "Arial Black", "Helvetica Neue", sans-serif;
      letter-spacing: -0.02em;
    }
    h1 { color: #5801ff; }
    h2 { color: #32323c; }
    strong { color: #5801ff; }
    em { color: #ff554e; font-style: normal; font-weight: 600; }
    a { color: #5801ff; }
    blockquote {
      border-left: 6px solid #ff554e;
      padding-left: 18px;
      color: #5d6c7b;
      font-size: 1.02em;
    }
    ul li::marker { color: #ff554e; }
    section::after {
      font-family: "Courier Std", "Courier New", monospace;
      color: #758696;
    }
    /* Projectlogo rechtsboven op elke slide */
    section::before {
      content: "";
      position: absolute;
      top: 30px;
      right: 48px;
      width: 127px;
      height: 36px;
      background: url("<BASE64-DATA-URI-VAN-PROJECTLOGO>") no-repeat center / contain;
    }
    /* Titelslide: paars vlak, logo groot op witte chip */
    section.lead { background: #5801ff; color: #fff; }
    section.lead h1 { color: #fff; font-size: 2.3em; }
    section.lead h2 { color: #dbff00; }
    section.lead::before {
      top: 56px;
      right: auto;
      left: 64px;
      width: 240px;
      height: 78px;
      background: #fff url("<BASE64-DATA-URI-VAN-PROJECTLOGO>") no-repeat center / 82%;
      border-radius: 10px;
    }
    section.lead::after { color: #fff; }
    footer { color: #999; }
  ```

- Slides, in this order — a client format may rename or restyle them, and the
  intake may drop some:
  1. Title, with the **demo date** (not the sprint's end date).
  2. Sprint goals, with the planning and meetings (sprint dates, refinement,
     retrospective, demo) from the tracker.
  3. Scope: one table for **gepland** and one for **extra opgeleverd** (ticket,
     plain-language summary, tracker status). The notes explain the extras.
  4. Per topic: the same tickets grouped by theme, extras marked `*` with a
     legend. Every `*` matches a row in the extra table.
  5. Demo intro: why this sprint matters and "hoe je naar de demo kijkt" (test
     data, counts that differ from production), plus the architecture
     before/after when agreed.
  6. One slide per `demoable` story, grouped by theme: the **headline is the
     value**, one or two supporting lines, one or two screenshots, and a link
     block. No implementation detail on slides.
  7. The `talk-only` work on one slide, and deliberate differences from today
     when there are any.
  8. Status and outlook, when agreed.
  9. Backlog findings (Phase 2), when there are any.
  10. What's next, and a closing slide.

### Screenshots and live links

- Take the screenshots on the demo environment, not production, with headless
  Chrome (`puppeteer-core` driving the system Chrome is enough). Basic auth
  goes through `page.authenticate`, with the credentials read from the env file
  **inside the script**, never on the command line. Load one page at a time
  with a pause between pages: a rate limiter in front of an upstream API can
  block a burst for every environment at once.
- Pick records that render well (a working cover, the button you are about to
  show) and crop out test content that would distract, such as placeholder
  text in the CMS. The screenshots go on the slides and are the runsheet's
  fallback.
- Each demo slide gets a link block with the URLs of its klikpad, all with the
  same `target="<name>"` so they open in one reused tab. The presenter clicks
  them in the audience window, and opens one beforehand so the login and the
  cookie banner are out of the way. Links point to the demo environment, never
  to production; in the shareable version, keep them only when the recipients
  have access.

### Architecture before/after (when agreed)

Render the tracked diagram, not a local copy, one page per image (draw.io: the
diagrams.net `viewer-static.min.js` in headless Chrome). Explain it in the notes
in plain language. Report typos and statements that no longer hold, such as a
count that changed or a fallback that only applies in production, to the user
instead of editing the diagram.

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
  Best fallback if the browser sync frustrates. **Presenter-only:** the file
  carries every note, so it is never the shareable version.
- `--pdf` — clean slides for the beamer, **no notes**; pair with the runsheet on
  a second device.

**Privacy:** the presenter view is a *separate window*. Notes stay private only
if the user shares the **audience window/tab** (not the whole screen). The plain
`deck.html` / PDF never shows notes, so sharing those is always safe — call this
out explicitly.

Marp pitfalls:

- The default theme centres slide content vertically. For client-format
  layouts, set `place-content: start` on `section` and keep centring only on
  the section slides.
- Every HTML comment becomes a presenter note, and Marp has no way to hide a
  slide. A commented-out slide either leaves an **empty slide** behind or,
  when the comment swallows its `---`, no empty slide at all, while its text
  ("fill in before the demo", `[..]` placeholders) lands in the notes of the
  slide before it, which the presenter reads live. Park a slide by moving it
  to `parked-slides.md` next to the deck, never by commenting it out, and name
  the parked slides in the runsheet header. After every render, list the
  slides, check for empty ones, and search `deck.html` for each parked
  slide's heading: none may appear.

### Shareable version (when agreed)

The client gets a `.pptx` without notes, in their own format:

- Build it on the client's previous deck rather than exporting from Marp: copy
  that file, duplicate its slides per section, and reuse its paragraph
  formatting (python-pptx: deep-copy a template paragraph as the prototype for
  each text kind). Leave out every notes slide and validate the package.
- Save the build script in the demo folder (`build-pptx.py`), never only in a
  session scratchpad, and put the command that runs it in the runsheet header,
  including where python-pptx comes from: the system `python3` often lacks
  it. A scratchpad is gone by the next session, and a sync without the script
  means patching slide XML by hand. That is a last resort for a text-only
  change: replace the exact `<a:t>` run in `ppt/slides/slide<N>.xml` with the
  stdlib `zipfile`, copy every other entry unchanged (`writestr(info, data)`
  keeps each entry's compression), and tell the user it was patched, not
  regenerated.
- `deck.md` is the single source. The user edits only `deck.md` and says when to
  sync; the pptx is regenerated from it on each sync, and nobody edits the pptx
  by hand until the final step. Once the user edits `deck.md`, never regenerate
  it from your own draft and never write to it while they are editing — both
  overwrite their changes.
- On each sync, compare the two both ways: every text in the pptx appears in
  `deck.md`, and every heading, list item and table cell in `deck.md` appears in
  the pptx. Report any difference beyond formatting.
- Render every slide to an image and look at it before the hand-off, checking
  for tables that overflow, text over pictures and titles that wrap. Without
  LibreOffice on macOS, `qlmanage -p -o <dir> <file>.pptx` writes an HTML
  preview whose `div.slide` elements can be screenshotted one by one. It
  writes into `<dir>/<file>.pptx.qlpreview/`, `<dir>` must already exist, and
  qlmanage does not start inside a command sandbox ("sandbox initialization
  failed").
- Both versions have the same slides in the same order, and the runsheet states
  the count.

### The demo folder is tracked

`docs/demo/sprint-<N>/` is tracked in git like any other doc, except for two
rendered files. `deck.html` is re-rendered from `deck.md` with one command. The
shareable `.pptx` reaches the client through the project's shared drive; with
its screenshots it runs to megabytes per sprint, too much for git history.
After the demo, `close-sprint` flattens the folder into
`docs/sprint-<N>/demo.md` and removes it, and git history keeps the source.

- Check `git check-ignore -v docs/demo/sprint-<N>/deck.md`. When it prints a
  rule — a folder-wide `docs/demo/` line in `.gitignore` (often added by an
  earlier version of this runbook) or in `.git/info/exclude` — remove it and
  tell the user which file held it.
- Make `.gitignore` ignore the rendered files only: add
  `docs/demo/**/deck.html` and `docs/demo/**/*.pptx` when missing.
- Note in the runsheet header where the shared pptx lives on the drive.
- The user commits the folder; never commit it yourself.

## Phase 8 — Review pause (stop here)

First, run a consistency pass and add every hit to the flags:

- Forward-looking claims ("released", "live", "set up in production") against
  the release branch: is the sprint's work an ancestor of it
  (`git merge-base --is-ancestor <sha> <release-branch>`)? Also check the
  tracker status of the ticket the claim rests on.
- Each slide against its own notes and the runsheet, since a note can
  contradict its slide after an edit.
- The rendered notes against the parked slides: no heading or placeholder of
  a parked slide appears in `deck.html`. A slide count without empty slides
  does not prove this.
- Dates and counts: the title date against the demo date, and the `*` markers
  against the extra table.

Print a summary: runsheet path, deck path, support docs created, total demo
time, demo order, and the Phase 2 and consistency flags awaiting the user's
confirm/drop decision. Then stop. The docs are the deliverable — do not edit the tracker or
the BLIs.

## Output

End with a concise list of:

- The runsheet path (`docs/demo/sprint-<N>/demo-script.md`).
- The deck path (`docs/demo/sprint-<N>/deck.md`) and the rendered
  `docs/demo/sprint-<N>/deck.html` (presenter view: press `p`).
- The shareable `.pptx`, when agreed, with its slide count and "no notes".
- Any support one-pagers created under `docs/demo/sprint-<N>/support/`.
- Validation flags (not "planned for Sprint N", missing BLI, not-yet-done) and
  consistency flags (Phase 8) that need a user decision.
- `talk-only` stories that will be mentioned but not shown live.
- Whether an ignore rule for `docs/demo/` was found and removed.
- The next step after the demo: suggest running `close-sprint` for Sprint N,
  which flattens `docs/demo/sprint-<N>/` into `docs/sprint-<N>/demo.md`. Revert
  any temporary local changes first (e.g. the mailer env guard).
- Whether to write customer release notes (`commands/release-notes.md`): it
  reads the runsheet's "Wat" and "Waarom het telt" lines as a source, before
  or after the close.
