---
tags: [address-review-comments, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "After the push, the run leaves both threads unresolved. It reads the note ids from the MR's discussions, adds a thumbsup award emoji to each addressed note, and posts one top-level MR note that mentions the reviewer, names the pushed sha, and offers the MR for another look. The closing report lists the pushed sha, the two awards and the note."
---

Go ahead and push, but don't resolve the threads. (Context the agent can discover: the approved changes for two reviewer notes on a GitLab MR are committed locally; the branch is not behind its target; the pre-push hook passes.)
