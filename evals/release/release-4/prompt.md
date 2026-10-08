---
tags: [release, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Because the project releases in batches and records no versioning decision, the skill asks once whether to introduce versions, recommending a setup MR now with the next release as the first versioned one, next to 'not now' and 'no versions, record that'. This release stays unversioned whatever the answer: the mails name it by date and the tracker only offers Done. When the user picks the introduction, the plan lists the setup MR through skills/create-pr (CHANGELOG.md, a versioning section in the runbook, the CONVENTIONS.md decision line) and a baseline tag on the current production commit."
---

Release starten. docs/release-process.md beschrijft een fast-forward van acceptance naar main, maar het project heeft geen tags, geen CHANGELOG.md en CONVENTIONS.md zegt niets over versies. Er gaan 11 commits mee, verzameld over drie weken.
