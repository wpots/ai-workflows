---
tags: [mr-merged, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run waits for the deploy job for about ten minutes and then stops. The recap shows the deploy as pending (⏳) with the pipeline link, and the rest of the closeout — ticket standing, proposed transition, cleanup — still completes. It does not wait indefinitely and does not call the deploy done."
---

The MR just merged, close it out. (Context the agent can discover: the target branch's pipeline for the merge commit is still running its test stage after fifteen minutes; the deploy job has not started.)
