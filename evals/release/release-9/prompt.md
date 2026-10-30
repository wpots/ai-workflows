---
tags: [release, runnable]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The plan names the weekday and does not promote on Friday as a matter of course: it proposes Monday 2 November, the first day of the preferred Monday to Wednesday, and asks for an explicit go if the user wants Friday anyway. A Friday promotion after that go is recorded as an exception in the GitLab Release description."
---

Release afronden voor RefugeeWork, versie 1.3.0. Het is vrijdag 30 oktober 2026, 15:20. De klant heeft acceptatie vanochtend goedgekeurd, de pre-flight is groen (geen migratie, env ongewijzigd, nachtvenster vrij), de start-mail is gisteren als concept klaargezet en de runbook noemt geen eigen deploy-venster. Toon het plan voor de promotie naar productie.
