---
tags: [release, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The skill reads the runbook, the scope and the tracker versions, then asks in one AskUserQuestion call for the recipients (proposing the six from the previous release mail), whether to share in #klant-website, and the version. It shows one plan block with the start-mail draft text and waits for the go; the plan's tracker step sets versions only and plans no ticket transition. After the go it creates a Gmail draft (not sent) and pauses until the user confirms the start mail is out, before any push to main."
---

We gaan releasen naar productie. Het project heeft docs/release-process.md (ff-push acceptance naar main, semver-tag, GitLab Release), de laatste tag is v1.1.2 en acceptance staat 14 commits voor op main zonder migratie. CONVENTIONS.md noemt Slack-kanaal #klant-website (C0123). Vorige week ging er een mail 'Release V1.1.0' naar zes mensen.
