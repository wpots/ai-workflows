---
tags: [backlog, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run finds the existing untracked item and the implementation worktree before writing, treats it as the item for this scope, updates it additively with only the facts it did not already contain, leaves the file and the README change uncommitted because they belong to another session, and reports what it added and whose work it is. It does not create a second file for the same scope and does not commit, rename or move the other session's files."
---

Write a backlog item for controlling next/link prefetch on the list surfaces of this site (mega-menu, result lists, carousels). (Repo context the agent can discover: `git status --porcelain docs/backlog/` shows an untracked `perf-search-link-prefetch-storm.md` written yesterday plus an uncommitted change to `docs/backlog/README.md`, and `git worktree list` shows a worktree on branch `OBA-perf-search-link-prefetch` — a parallel session is already drafting and implementing this scope.)
