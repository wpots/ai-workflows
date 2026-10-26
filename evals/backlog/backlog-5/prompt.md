---
tags: [backlog, runnable]
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The response gives ALPHA-42-feat-search-1-results.md and ALPHA-42-feat-search-2-filters.md for two draft slices of ALPHA-42, and BETA-9-chore-release-route.md for BETA-9. It places the generic naming policy in shared rules/backlog.md and the backlog skill, with the fallback command aligned, rather than in one project's CONVENTIONS.md. It includes updating references when renaming existing items."
---

Onze BLI's missen hun Jira-prefix. Dit geldt voor al onze projecten. Geef in
deze controle alleen de juiste bestandsnamen en waar de algemene regel en de
controle daarop thuishoren; wijzig geen bestanden en maak geen Jira-tickets.

- `feat-search-1-results.md` en `feat-search-2-filters.md` zijn twee slices met
  `## Ticket` = `ALPHA-42`; beide staan nog op `draft`.
- `chore-release-route.md` heeft `## Ticket` = `BETA-9`.

Wat moet er bij het hernoemen nog worden bijgewerkt?
