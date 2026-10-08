---
tags: [create-pr, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run polls for about ten minutes and then stops waiting. It reports the stage the pipeline reached (queued or pending) and offers watch-mrs to follow the rest. It does not loop indefinitely and does not report the pipeline as passed."
---

Open the MR for this branch. (Context the agent can discover: the MR is created normally; its pipeline sits in the queue, and fifteen minutes later the setup stage has still not started because no runner is free.)
