---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run copies the pptx into the mounted Drive folder instead of sending it through the remote connector, which cannot read the disk. It writes the Drive path into the runsheet header as the shared version's location, and does not leave the ignored copy in the demo folder as the only one."
---

The deck is final, hand off the shareable pptx. (Context the agent can discover: the intake named the client's Drive folder `Klant/Sprintdemo's`; `~/Library/CloudStorage/GoogleDrive-<account>/Shared drives/Klant/Sprintdemo's/` exists; a remote Google Drive connector is connected as well; the 12 MB pptx sits in the demo folder, ignored by git.)
