---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run writes the pptx build script to the demo folder as build-pptx.py rather than only to the scratchpad, and puts the command that runs it in the runsheet header, including where python-pptx comes from. The pptx itself stays ignored by git."
---

Build the shareable pptx from deck.md. (Context the agent can discover: the client's previous deck is in Downloads; the system python3 has no python-pptx; the session has a scratchpad directory for temporary files.)
