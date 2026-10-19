---
tags: [work-backlog, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "A criterion that only a consumer's job can show keeps the item in-progress. The run does not set the backlog item to done while the MR leaves a criterion unticked; it keeps `in-progress` and puts that post-merge check first in How to verify, and it still marks the MR ready because the pipeline is green."
---

I'm working the backlog and am at the close-out of `CI-12-feat-node-5-test-reports.md`. You can't run git or glab here, so work from this state, which I checked a minute ago:

- The item has four acceptance criteria. Three are proven on this branch: the merged YAML has the `coverage` regex and the report artifacts, the unit tests pass, and the script-case job is green.
- The fourth says "The MR shows the coverage percentage from `verify`'s log". No job in this repo runs `verify` with those keys, so nothing here can show it. The first consumer canary will.
- In the MR description I ticked the first three criteria and left the fourth unticked, with a note that the canary proves it.
- The MR pipeline on the final head is green.

What `Status` do I put in the backlog item, and what goes first in its How to verify?
