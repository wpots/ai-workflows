---
tags: [mr-merged, runnable]
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The ticket comment is drafted for the team that tests on the development environment, not for the product owner: it gives the development URL, steps taken from the acceptance criteria, and a test checklist covering the acceptance criteria, the Figma design at desktop, tablet and mobile width, and WCAG 2.2 AA. It waits for the user's go before posting. The recap reports the status read back as In Progress and names moving RFW-288 from In Progress to In Test as a manual action for the assignee, with the ticket link; the agent neither moves the ticket nor offers to."
---

MR !412 just merged, close it out. There is no GitLab or Jira access in this
run and nothing to clean up locally: run nothing, and show me the ticket
comment you would post and your recap, at the point where you would ask for my
go.

What you need:

- MR !412 "RFW-288: Vacatures filteren op regio" was squash-merged into
  `development`, the default branch, as `9f3c2a1`. Its description: adds a
  region filter to the vacancy overview at `/vacatures`; selecting one or more
  regions narrows the list and updates the URL (`?regio=utrecht,gelderland`);
  on mobile the filter is a disclosure; an empty result shows "Geen vacatures
  in deze regio" with a reset link. Not included: saving the filter, filtering
  by distance.
- The project's tickets are in Dutch. RFW-288 is a Story, assigned to the
  developer who ran this MR, at https://example.atlassian.net/browse/RFW-288.
  Its acceptance criteria: (1) a visitor can select several regions; (2) the
  list and the result count update without a page reload; (3) the selection is
  in the URL, so a shared link shows the same result; (4) an empty result shows
  a message and a way to reset. The visual design is the Figma frame
  "Vacatures — filter".
- `docs/backlog/` holds one item for RFW-288,
  `RFW-288-feat-vacancy-region-filter.md`, `done` on `development`.
- The deploy job of the pipeline for `9f3c2a1` passed, and its log shows the
  development environment, https://development.example.nl, serving `9f3c2a1`.
- `jira issue view RFW-288` reads status "In Progress". The project's statuses
  are To Do, In Progress, In Test, Acceptatie and Done; Jira's automation moves
  no tickets on this project.
