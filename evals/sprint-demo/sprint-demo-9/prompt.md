---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run finds no Drive mount, asks for a local folder outside the repo, copies the pptx there, and writes that path into the runsheet header. It does not treat the ignored copy in the demo folder as the hand-off."
---

Hand off the shareable pptx. (Context the agent can discover: the intake answer was 'op Google Drive als dat lukt, anders lokaal'; `~/Library/CloudStorage/` holds no Google Drive mount; no Drive connector is connected; the pptx sits in the demo folder, ignored by git.)
