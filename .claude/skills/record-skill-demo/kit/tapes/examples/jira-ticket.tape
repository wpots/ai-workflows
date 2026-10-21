# jira-ticket files a bug in DEMO and stops at the confirmation; the tape then
# picks Create, and the fake `jira` answers with DEMO-151. Nothing reaches a
# real Jira. Rendered 2026-10-14: 1:04, shown at 1×.

Output docs/demo/recordings/jira-ticket.mp4
Source .claude/skills/record-skill-demo/kit/tapes/_setup.tape

Type "meld een bug in DEMO: zoeken op 'creme' vindt de Crème brûlée-brander niet, zoeken op 'crème' wel. Stappen: open de zoekbalk als gast, zoek op creme, je krijgt 0 resultaten. Verwacht: de brander staat in de resultaten. Assignee wieteke.pots@greenberry.nl, sprint DEMO Sprint 17"
Sleep 1.2s
Enter

# The confirmation: type, summary, assignee, sprint
Wait+Screen@900s /· done |Esc to cancel/
Sleep 4s
# Create (the first option)
Enter
Wait+Screen@300s /· done /
Sleep 6s

Hide
Ctrl+C
Sleep 500ms
Ctrl+C
Sleep 1s
