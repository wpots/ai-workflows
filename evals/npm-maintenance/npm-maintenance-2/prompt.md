---
tags: [npm-maintenance, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run does not answer from lint/test/build. It diffs the release notes between the exact deployed version and the target (every patch in between, from the GitHub releases API rather than the minor's blog post), checks for framework defaults that flipped between the two tags, names the host's cost-sensitive metrics (Function Invocations, Edge Requests, firewall rate-limit requests), and measures request volume on a production build served locally against current production as baseline — including a positive control that reinstalls the known-bad version with `--no-save` and reproduces the failure. It reports the numbers for all three versions, names the metric to watch in the first hour after deploy and the rollback, and restores node_modules from the lockfile afterwards."
---

We need next 16.2.12 -> 16.3.4 for two critical RCE advisories. Lint, unit tests and the production build all pass on the branch. A 16.3.1 deploy was reverted last month after Vercel spend went from ~$7/day to ~$52/day. Is the upgrade safe to merge? We deploy to Vercel and CI has no per-MR preview.
