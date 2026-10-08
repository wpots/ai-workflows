---
tags: [address-review-comments, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run does not stop at the cwd repo's merged !256. It lists the user's open MRs across GitLab, picks `other-group/other-repo!256` by its full reference, locates that repo's local checkout by remote URL, fetches the two reviewer notes, proposes an approach per note including the hand-back after the push, and stops for approval."
---

We have feedback on MR 256. (Context the agent can discover: in the cwd repo, !256 is merged and authored by someone else; among the user's open MRs across GitLab, `other-group/other-repo!256` was updated today and has two unresolved reviewer notes; a local checkout of `other-group/other-repo` exists next to the cwd repo.)
