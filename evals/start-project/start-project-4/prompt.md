---
tags: [start-project, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Lane 2 puts the service coordinates in `CONVENTIONS.md` under Tooling, not only in the brief, because skills read them there: both Slack channels with their ids and which one the client reads, the Jira key with its boards and the `-p <KEY>` the machine default needs, the Figma file marked as a concept, and the Drive folder with the production dump marked as data that stays local and never goes into the repository or a test fixture."
---

Kickoff for bakkerij-jansen-website, lane 2. Lanes 0 and 1 are done, so `CONVENTIONS.md` exists. This is what I collected:

- Slack: `#jansen-greenberry` (`C0AAA111`), shared with Bakkerij Jansen, where we post releases; `#jansen-internal` (`C0BBB222`), Greenberry only.
- Jira: project `BJ`, scrum board `812`, kanban board `813`. My `jira` CLI is configured for another project by default.
- Figma: one design file, `https://www.figma.com/design/abc123/Bakkerij-Jansen`. The designer says it is a concept, not final.
- Google Drive: a content migration folder with a MySQL dump of their current production site.

Where does each of these go, and with what note?
