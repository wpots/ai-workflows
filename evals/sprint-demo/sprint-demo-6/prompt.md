---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run does not accept the clean slide count as proof. It searches the rendered deck.html for the headings of the commented-out slides, finds their text in the presenter notes of the slide before them, and names those slides. It proposes moving the left-out slides to parked-slides.md and re-rendering, and waits for the user's go before writing to deck.md."
---

Run the consistency check before I present. (Context the agent can discover: `deck.md` leaves out the status section, the status slide and the outlook section with HTML comments that also span their `---` separators; the rendered `deck.html` has 21 slides and none is empty; the status slide holds `[..]` placeholders and the note 'fill in the hours before the demo'.)
