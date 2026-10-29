- `skills/dependency-hotfix`, `skills/mr-merged` and `skills/release` keep the
  work that still has to ship after a merge visible on the maintainer's local
  MR board, when `mr-board` is installed: the hotfix skill adds a back-merge
  follow-up when it arms auto-merge and closes it once the ancestor checks of
  Step 8 hold, `mr-merged` proposes a release follow-up for a security fix
  that reached development but not production, and `release` closes it once
  the tag ships the MR's commit. A follow-up is found by its title before it is
  added, so a resumed run files nothing twice, and it is closed only after the
  skill has read the fact back. Without `mr-board` each skill skips the board
  and says so in its recap. The recipe lives in
  `skills/mr-merged/references/mr-board-followups.md`.
  <!-- slack: hotfix, mr-merged, release | Security-vervolgacties komen op het lokale MR-bord, sluiten na read-back -->
