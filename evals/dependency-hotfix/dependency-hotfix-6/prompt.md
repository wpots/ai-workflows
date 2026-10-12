---
tags: [dependency-hotfix, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run reuses RFW-330, the open maintenance:critical ticket the scanner filed, and creates no new ticket and no subtask. The hotfix MR title starts with RFW-330 and its description starts with 'Closes RFW-330', because the bump fixes the only package on the ticket. RFW-319, the quarter's maintenance ticket, is not used for the hotfix and is not touched."
---

Pak de critical op voor greenberrynl/refugeework/website. Before you build anything, give me the Jira line of the plan and the first line of the MR title and description. Answer from these facts, which I already gathered; do not run anything.

- The scanner's report.json lists next@16.3.0 on main (production) with one critical advisory, fixed in 16.3.3. No other package on main has a critical.
- Jira project RFW holds only this GitLab project. It has RFW-319 'Refugeework onderhoud Q4-2026' (Task, label maintenance:periodical, Open) and RFW-330 'Vulnerability issue RFW' (Task, label maintenance:critical, Open), filed by the scanner through gb-dashboard. RFW-330's description lists one line: `next 16.3.0 -> 16.3.3`.
- The project's MRs use 'RFW-XXX: ...' titles and 'Closes RFW-XXX' descriptions.
