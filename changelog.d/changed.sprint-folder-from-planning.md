- `docs/backlog/` now holds open work only. `sprint-planning` creates the
  sprint folder `docs/sprint-<N>/` up front, and the commit that sets a BLI to
  `done` moves it there with `git mv` and fixes the links the move breaks
  (`rules/backlog.md` § Done Items Leave the Backlog; `work-backlog` step 8
  does it on the feature branch). `close-sprint` files the stragglers, moves a
  BLI that is in the folder without being `done` back, and removes the
  planning `.gitkeep`. `mr-merged`, `close-sprint` and `sprint-demo` look up
  BLIs in the sprint folder too.
  <!-- slack: rules/backlog.md | Een BLI verhuist bij done direct naar docs/sprint-<N>/, zodat de backlog tijdens de sprint krimpt -->
