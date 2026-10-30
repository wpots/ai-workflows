- `ticket-handoff`: the stretch after the test comment. It reads the replies
  since the last handoff comment and classifies the newest one as findings, no
  findings, product owner approves, product owner rejects, or unclear (reported,
  never guessed). Findings and rejection reasons go to a backlog item in scope
  or a new ticket out of scope; with no findings it drafts the comment for the
  product owner and posts it after the user's go; on approval it checks the
  Done layer line by line. It names the assignee's move with the ticket link
  and never moves a ticket or fixes anything. The Feedback triage gate in the
  pipeline map goes from absent to partial.
  <!-- slack: ticket-handoff | Nieuwe skill leest de reactie van tester of PO en zet de volgende stap voor de assignee klaar -->
