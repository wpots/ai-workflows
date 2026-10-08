---
tags: [close-sprint, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Besides the usual close, the run writes `docs/sprint-16/demo.md`: a header with date, audience, environment and the pptx's Drive location, then per slide the title, what was shown, the tickets and the demo URLs, plus the expected questions. It leaves out the klikpad, checklists, screenshots and rendered files. The durable caveat goes to its home rather than into the record, the open flag goes to the gaps document, and the support one-pager moves next to the record. It checks that the pptx is at the Drive path, then lists what the untracked demo folder holds and asks before deleting it, without committing the folder or offering to. It adds the record to the changelog's Archief without a git recipe for the deck, and does not treat demo.md as a Phase 5b working document."
---

Close sprint 16. (Context the agent can discover: `.gitignore` ignores `docs/demo/`; `docs/demo/sprint-16/` holds `deck.md` with twelve slides and presenter notes, `demo-script.md` with a klikpad, a setup checklist and the Drive path of the shared pptx, `support/RFW-120-overstap.md`, twenty screenshots, the rendered `deck.html` and a 12 MB shareable pptx; the pptx is present at the Drive path; one note says '(Niet voorlezen: de detailpagina geeft een 404 op productie tot de release)'; the runsheet lists one open flag, a closing-slide claim that the release is live.)
