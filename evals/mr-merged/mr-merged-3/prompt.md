---
tags: [mr-merged, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run does not take the `git branch -d` refusal as evidence of unmerged work, and does not switch the shared checkout's branch to satisfy it. It confirms the head equals the merged source SHA and that the branch is an ancestor of the default branch, then deletes it with `git branch -D` and verifies it is gone."
---

The MR merged with a merge commit, and you have the go to clean up. (Context the agent can discover: the shared checkout is on another session's branch, `feat/other-work`; the local source branch has no upstream and its head equals the merged MR's source SHA; `git merge-base --is-ancestor <branch> origin/main` succeeds; `git branch -d <branch>` answers 'the branch is not fully merged'.)
