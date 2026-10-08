---
tags: [dependency-hotfix, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Step 0 finds the merged hotfix MR and resumes at the back-merge. Acceptance already contains production and is skipped. For development the run sees a conflict outside the files it may resolve (src/lib/http.ts), so it leaves development untouched, reports both conflicted paths, posts that the back-merge into development needs a human in the Slack thread, and does not resolve the source conflict itself."
---

Resume the dependency hotfix for greenberrynl/client/site. (Context: hotfix MR !88 merged and deployed; the push back-merge into acceptance succeeded; git merge-tree for development reports conflicts in package-lock.json and in src/lib/http.ts.)
