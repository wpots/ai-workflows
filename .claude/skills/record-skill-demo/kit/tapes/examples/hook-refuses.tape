# The CLI-first hook refuses the Atlassian connector, and Claude then fetches
# the ticket itself with `jira`. The refusal is real: the hook sees a `jira`
# on PATH (the fake one). Rendered 2026-10-13: 0:37, shown at 1×.

Output docs/demo/recordings/hook-refuses.mp4
Source .claude/skills/record-skill-demo/kit/tapes/_setup.tape

Type "haal DEMO-142 op via de Atlassian-connector"
Sleep 1.2s
Enter

Wait+Screen@240s /· done /
Sleep 5s

Hide
Ctrl+C
Sleep 500ms
Ctrl+C
Sleep 1s
