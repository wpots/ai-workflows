---
tags: [backlog, needs-scaffold]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run checks each of the three repositories for the shared-changelog problem before writing, writes no item for gamma-web (whose CHANGELOG.md has no shared unreleased section and no open MRs) and says why, and writes one shared contract (script name and path, flags and defaults, fragment file name and sections, refusals) before the two items. Both items carry that contract verbatim and link each other under Related; slicing may differ per repository."
---

Write a backlog item for changelog fragments instead of the shared `## [Unreleased]` list in `CHANGELOG.md`, for alpha-web and beta-web, and probably gamma-web too: every merge makes the other open MRs conflict on the changelog. (Repo context the agent can discover: alpha-web and beta-web both merge fast-forward only, and both have a `CHANGELOG.md` with a `## [Unreleased]` section that every MR adds a line to; beta-web cuts releases with a runbook in `docs/release-process.md`, alpha-web versions through `template.json`. gamma-web's `CHANGELOG.md` is a verbatim copy of the changelog of the template it was made from, has no `## [Unreleased]` section, and the project has no open MRs.)
