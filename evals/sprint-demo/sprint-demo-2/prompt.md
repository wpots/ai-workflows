---
tags: [sprint-demo, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run splits the scope into a planned table and an 'extra opgeleverd' table using the created date against the sprint start, instead of flagging the nine later stories as planning mismatches to drop. The notes explain that the extras were picked up during delivery. The twelve open issues created during the sprint become a backlog-findings slide. On the per-topic slide, every extra is marked and every mark matches a row in the extra table."
---

Build the scope slide for the sprint demo. (Context the agent can discover: the sprint started 9 September; nine stories were created before that date and carry the planned-for-sprint label; nine more were created between 24 and 28 September and are in the sprint without the label; twelve issues created during the sprint are open on the backlog, not in any sprint.)
