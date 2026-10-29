- `jira-ticket` writes a story in the team's format: Description (what is built
  and where it is used), Acceptance criteria, Visual design (the link to the
  design, or "no UI") and Dependencies (content, a coupling or another party, or
  "none"), with no "As a …, I want …, so that …" sentence. Every story goes
  under an epic the user confirms from the open epics; the skill never picks or
  creates one. A story that cannot be described yet goes in as a placeholder
  with "(specificeren)" behind its summary and empty sections. When an open
  question holds up the build, the confirm step proposes flagging the story with
  a comment that gives the reason and names who answers; the CLI cannot mention,
  so the recap asks you to tag them.
  <!-- slack: Stories in ons format, altijd onder een epic, met placeholder en flag-voorstel -->
