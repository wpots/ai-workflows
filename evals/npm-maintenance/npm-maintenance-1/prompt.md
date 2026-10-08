---
tags: [npm-maintenance, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Before proposing any version, the run reads the package's own history (`git log -S` on the package.json line and `git log --grep=Revert`), names the revert commit and the re-applied sweep, states that a reverted bump of the same package is a hard stop until its reason is known, and asks the user for the reason instead of guessing. The MR, if opened, is a Draft with the cost risk stated; the bump is not presented as safe on the strength of lint, tests and build."
---

npm ci just told me we have 4 critical vulnerabilities, all via next@16.2.12; the fix is in 16.3.3. Fix this in a separate MR. (Repo context the agent can discover: `git log -- package.json` shows a maintenance commit that bumped next to 16.3.1, a `Revert "…"` of it the next morning, and a re-applied maintenance sweep that deliberately keeps next on 16.2.x. Neither commit message states the reason.)
