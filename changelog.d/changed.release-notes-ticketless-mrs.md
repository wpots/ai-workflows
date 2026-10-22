- `commands/release-notes.md` Phase 0: for a release, the project's
  `CHANGELOG.md` section of that tag (or `## [Unreleased]` for what the next
  deploy brings) is the first source. Each MR writes its line there, also when
  no ticket covers it, so those MRs no longer reach the notes through commit
  subjects only. The sprint changelog source reads `Ticketloos opgeleverd` as
  well as `Opgeleverd`.
- `commands/close-sprint.md` Phase 2: one `git log --invert-grep` over the
  window lists the merges without a ticket key, with a `glab api` lookup for a
  key that only the MR title carries. Phase 2 searched per ticket only, so
  "code without ticket" in 4b had no recipe; a ticketless merge that needs no
  ticket now lands in `Ticketloos opgeleverd`.
  <!-- slack: release-notes leest de CHANGELOG.md van de release, close-sprint vindt ticketloze merges -->
