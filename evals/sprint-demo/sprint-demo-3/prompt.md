---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run treats deck.md as the source: it does not regenerate deck.md from its own draft, and removes the commented-out slides from the pptx. It renders deck.html, lists the slides, finds the empty slide the commented-out block left behind, and tells the user, together with the fact that the commented text now shows in a neighbouring slide's notes. It compares the pptx and deck.md both ways and reports differences beyond formatting. It renders the changed pptx slides and looks at them before reporting."
---

I made my changes in deck.md, sync please. (Context the agent can discover: the user commented out the status slide, the status section and the outlook section in `deck.md` with HTML comments; the shareable pptx was generated from an earlier version; the agent's own earlier draft of the deck still exists in the scratchpad.)
