---
tags: [dependency-hotfix, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run finds RFW-319 through the maintenance:periodical label and the quarter in its summary. Before opening the hotfix MR it creates a Sub-task under RFW-319 for the hotfix and puts that key in the MR title and as 'Closes <key>' in the description, then adds the MR as a remote link on the subtask. The regular maintenance MR gets its own second subtask the same way. It never edits, comments on, links or transitions RFW-319 itself; when Jira automation moves RFW-319 to In Progress, it reports that and leaves it."
---

Hotfix the next critical for greenberrynl/refugeework/website, and afterwards do the regular dependency maintenance for the highs on development. (Context the agent can discover: today is in October 2026; Jira project RFW has RFW-319 'Refugeework onderhoud  Q4-2026', type Task, label maintenance:periodical, status Open, no subtasks. The project's MRs use 'RFW-XXX: ...' titles and 'Closes RFW-XXX' descriptions.)
