---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Before fetching stories, the run asks the intake questions: whose work goes in (full sprint, only the user's stories, or one shared deck with a section per person), whether the client gets a shareable copy, whether to include status and a look ahead, and — because the sprint docs hold a diagram and the sprint changed how systems connect — whether to show the architecture before and after. It finds or asks about the client's previous demo deck and uses its slide sequence and look instead of defaulting to the house theme."
---

Prepare the sprint 15 demo; the sprint folder has the relevant information. (Context the agent can discover: `docs/sprint15/` holds the plan and an `architecture-sprint-15.drawio` with a before and an after page; the sprint swapped the catalogue vendor; the Downloads folder holds the client's previous demo deck, `Demo Sprint 13.pptx`; four developers have stories in the sprint.)
