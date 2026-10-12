---
tags: [dependency-hotfix, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run looks for an open maintenance:critical ticket in RFW and finds none. Before opening the hotfix MR it creates a Task with label maintenance:critical, not a Sub-task, puts that key in the MR title and as 'Closes <key>' in the description, and adds the MR as a remote link on that ticket. The regular maintenance MR for the highs names RFW-319, found through the maintenance:periodical label and the quarter in its summary, as 'Part of RFW-319' without a closing keyword, and creates no ticket. It never edits, comments on, links or transitions RFW-319 itself."
---

Hotfix the next critical for greenberrynl/refugeework/website, and afterwards do the regular dependency maintenance for the highs on development. (Context the agent can discover: today is in October 2026; Jira project RFW has RFW-319 'Refugeework onderhoud  Q4-2026', type Task, label maintenance:periodical, status Open; RFW has no open ticket with label maintenance:critical. The project's MRs use 'RFW-XXX: ...' titles and 'Closes RFW-XXX' descriptions.)
