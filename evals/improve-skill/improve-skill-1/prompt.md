---
tags: [improve-skill, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The retrospective's report gives the learning that rests on an outside fact (glab mr list has no --state flag) a condition under which it stops holding, and marks the learning about the repo's own branch naming as permanent."
---

Run the retrospective on the `watch-mrs` run we just finished, but report only: give me the report you would end with, one line per learning, and don't edit any files.

What happened in that run:

1. You listed merged MRs with `glab mr list --state merged`. It failed with `unknown flag: --state` (glab 1.46, checked today). `glab mr list --merged` worked.
2. I corrected the branch name you picked, `OBA-150-share-vacancy`. In this repo a branch is `<type>/<slug>`, for example `feat/share-vacancy`, never with the ticket key in front.
