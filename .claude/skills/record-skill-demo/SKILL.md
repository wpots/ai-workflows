---
name: record-skill-demo
description: Record a greenberry skill or hook as a demo clip — a real Claude Code session on the fictional Demo Shop project (fake jira and glab, Jira project DEMO, MR !12), scripted as a VHS tape, sped up where it waits, and placed in a Slides deck as a recording slide. Use when the user wants to record, re-record or speed up a skill demo or a terminal recording for a plugin demo ("skill-demo opnemen", "terminalopname", "schermopname van een skill", "demo-opname", "VHS-tape", "versneld afspelen", "opname voor de demo"), or asks how the October 2026 plugin-demo recordings were made.
metadata:
  owner: wieteke.pots
---

# Record Skill Demo

A skill has no screen to click through, so a demo shows a real session. Claude,
the skills and the hooks are real. The project, the tickets and the colleagues
are fictional: never record on a client repository or with client data. Every
render is a fresh run and comes out a little different.

## The kit

Everything lives next to this file, in `kit/`:

| Path | What it is |
| --- | --- |
| `build-demo-shop.mjs` | Rebuilds `~/.worktrees/demo-shop` and its bare origin `~/.worktrees/demo-shop-origin.git`, with a dated history that matches the fake Jira |
| `fixtures/` | The Demo Shop code, BLIs and sprint 15–16 documents, applied commit by commit |
| `demo-jira-data.cjs` | Project DEMO: people, sprints 15–17, epics, tickets |
| `bin/jira` | Fake jira-cli: the recipes from `skills/service-cli/references/jira.md`; a write prints a fake confirmation and changes nothing |
| `bin/glab` | Fake glab: one merge request, `demo-shop/webshop!12`, on a timeline (below); `glab mr merge` refuses |
| `tapes/_setup.tape` | The look, and Claude started off-screen in the Demo Shop with `bin/` first on PATH |
| `tapes/examples/` | The tapes behind the October 2026 recordings |
| `prepare-clip.mjs` | Turns a raw recording into a deck clip and a still |

The developer in the Demo Shop is Wieteke Pots, the plugin's maintainer;
Robin Jansen, Noor Bakker and product owner Sanne de Wit are fictional. The
CLI-first hook really fires: it sees a `jira` on PATH.

The fake `glab` starts its timeline at its first call, about 70 seconds per
phase (`DEMO_GLAB_PHASE_SECONDS` changes it): pipeline running → lint fails →
Robin's review comment → new pipeline → success → approved and mergeable.

## 1. Prepare

- Tools: `vhs` (`brew install vhs`, which brings `ttyd`) and `ffmpeg`.
- A working folder for the demo, `docs/demo/<yyyy>-<mm>-<slug>/`, untracked
  like the rest of a demo's working files. Raw recordings and clips never go
  into git.
- Quota: every render is a full Claude run on your own seat. Eight renders plus
  the failed takes used up the rest of a weekly limit on 2026-10-13. Name the
  cost before a batch, and for long sprint skills consider `claude --model
  sonnet` in `_setup.tape`.
- Recording a skill that is not released yet: put `claude --plugin-dir
  <worktree of that branch>` in `_setup.tape`, so the branch's skills load
  over the installed plugin.

## 2. Build the Demo Shop

```sh
node .claude/skills/record-skill-demo/kit/build-demo-shop.mjs
npm install --prefix ~/.worktrees/demo-shop --no-package-lock
```

The build syncs the ai-workflows project files from this checkout, pushes every
branch to the local origin, and ends on `feature/DEMO-132-kortingscode`, the
branch with planted faults for code-review. A rebuild also resets the fake
CLIs: their state lives in the Demo Shop's `.git` folder. Rebuild before every
recording that depends on a clean state; the sprint skills write documents and
backlog items that stay behind.

Order for the sprint skills: sprint-demo, then close-sprint (it clears the
demo folder), then commit and push close-sprint's output to `development`
yourself, then sprint-planning.

## 3. Write the tape

Copy the closest example from `kit/tapes/examples/` into
`docs/demo/<yyyy>-<mm>-<slug>/recordings/` and point its `Output` at that
folder (VHS creates it). Keep the `Source` line. Then:

- **Ask in plain language, never through `/`.** The popup behind `/` renders
  with old lines and several `❯` markers through it, even typed in one go or
  after `Ctrl+L`. Take a screenshot of the `/greenberry:` list instead.
- **The whole intake in the first sentence.** The sprint skills ask one thing
  at a time and a tape cannot answer: put the sprint, the project, the e-mail
  address and the choices in the prompt.
- **End on the footer:** `Wait+Screen@<timeout> /· done |Esc to cancel/`. The
  "· done" line appears only when the turn is over; "Esc to cancel" catches a
  question from the skill. Sprint skills need up to 1500 s.
- **Absolute paths between double quotes**, or the VHS parser splits them.

`_setup.tape` already handles the rest: it unsets the `CLAUDE*` variables (a
session started from inside another one shows a transcript warning in the
footer), confirms the trust prompt, which starts on "No, exit", waits for
`shift+tab to cycle`, and clears the banner with `Ctrl+L`.

## 4. Render

From the root of ai-workflows, outside the sandbox (the recorded session needs
the network and the keychain), one tape at a time — two parallel renders broke
once with `use of closed network connection`:

```sh
vhs docs/demo/<yyyy>-<mm>-<slug>/recordings/<name>.tape
```

Watch the result before using it. Did the skill finish, did it stop on a
question, is the answer in the language you want? The answer language changes
between runs of the same Dutch prompt; render again when it matters.

## 5. Prepare the clip

```sh
node .claude/skills/record-skill-demo/kit/prepare-clip.mjs <raw.mp4> <clip.mp4> --keep <s> --speed 4
```

The typing plays at 1×, the rest at `--speed`, and the last frame stays up for
`--hold` seconds (8). The clip is re-encoded small, with a still of its last
frame next to it (`<clip>.jpg`), and the script warns above 20 MB, the deck's
limit for a clip.

- `--keep` is the second at which the prompt is sent: read it off the raw
  recording. It grows with the prompt's length; the October recordings needed
  8.8 s (watch-mrs) and 11.9 s (sprint-planning).
- `--speed 4` for skills that wait or run long: watch-mrs, sprint-demo,
  close-sprint, sprint-planning. `--speed 1` where the viewer reads along:
  code-review, the hook, jira-ticket.

## 6. Put it in the deck

In a Slides artifact, upload the clip and the still as assets, and add a
recording slide right after the slide that explains the skill. The October
deck's recording slides look like this:

```html
<section id="rec-watch" data-transition="fade" style="display:flex; flex-direction:column; gap:12px; padding:40px 142px 0; background:#5801ff">
  <div style="display:flex; flex-direction:column; gap:6px">
    <p style="font-family:'IBM Plex Sans', Arial, sans-serif; font-size:24px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#dbff00">Opname · watch-mrs · 4× versneld · 2:36</p>
    <h2 style="font-family:'JetBrains Mono', 'Courier New', monospace; font-size:32px; font-weight:600; line-height:1.3; white-space:nowrap; color:#ffffff">houd MR !12 van demo-shop/webshop in de gaten, interval 1 minuut, auto-merge uit</h2>
  </div>
  <img src="/_blob/<still>" alt="<what the last frame shows>" data-video="/_blob/<clip>" style="width:1636px; height:920px; object-fit:contain">
  <aside><what you typed, and what to watch for></aside>
</section>
```

The eyebrow names the skill, "4× versneld" when sped up, and the clip's
length; the title is the prompt as typed. Google Slides plays video only from
Google Drive: in an exported deck, put the clip in a shared Drive folder and
insert it there.

## A recording of the app

The desktop app cannot be scripted like a terminal. Record it by hand
(`Cmd+Shift+5`, selected window) on the same Demo Shop, then run the file
through step 5 and 6; `prepare-clip.mjs` reads a `.mov` as well. The fake
`jira` and `glab` have only been used from the terminal so far: check that the
app's session finds them before you record.

## Constraints

- Fictional data only, in the fixtures, the tapes and the prompts.
- Changes to the kit land through an MR with reviewer `wieteke.pots`
  (`.claude/rules/upstream-mr.md`).
- The fixtures plant faults on purpose, including a fake API key in
  `25-DEMO-132`: they are what code-review finds on camera.
