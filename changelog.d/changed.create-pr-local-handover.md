- `create-pr`: a diff that touches the UI is handed over locally before the
  approval ask. The agent serves the branch (Storybook and the dev script, from
  the worktree), opens every changed story and a page that renders the
  component in a browser the user sees, and leaves them running. The same ask
  offers screenshots for the MR description; only after a yes are they
  uploaded (`glab api … /uploads`) into the verification section. The worktree
  that serves the handover stays until the user is done checking.
  `work-backlog` runs the handover in the user's own session and ends its
  report with the screenshot question.
  <!-- slack: Lokale oplevering | UI-wijziging: agent opent story en pagina op localhost; screenshots in MR pas na een ja -->
