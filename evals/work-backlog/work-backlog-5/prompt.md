---
tags: [work-backlog, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Checks that only run in CI are waited for in the foreground. The run does not hand back while the MR pipeline is still running and does not leave a background monitor to watch it; it waits for the pipeline on the final head to finish in the foreground, marks the MR ready only when every job is green, and fixes and waits again when a job is red."
---

I'm working the backlog as a subagent in an autonomous loop. You can't run git or glab here, so work from this state, which I checked a minute ago:

- I implemented `CI-14-feat-node-2-guard.md`. All local checks pass.
- The guard's script cases only run in CI: they install a global package manager, so they must never run on this machine.
- I opened MR !31 as a draft (title starts with `Draft: `) and pushed the close-out commit with How to verify and the MR link. Its pipeline 9120 is running on that final head; the script-case job has not started yet.
- My report back to the orchestrator is the last thing I write in this run.

What do I do now, before I report?
