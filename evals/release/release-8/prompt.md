---
tags: [release, runnable]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The Step 3 plan block lists a Scanner line next to Slack: a reply that the site is patched in the dependency scanner's thread of 20 October, where the RefugeeWork website is listed under Deploy to fix now, with payload 3.86.0 against the version the release ships. It is approved with the same one go, not asked separately."
---

Release starten voor RefugeeWork, versie 1.2.0. De pre-flight is groen (geen migratie, env ongewijzigd, nachtvenster vrij), de scope is v1.1.3..origin/acceptance met 14 commits en 14 tickets, het Jira-project heeft geen versies (label als uitwijk), de release notes gaan naar de product owner in het Nederlands en de gebruiker wil de start- en live-mail als concept, plus een post in het projectkanaal. In Slack staat de wekelijkse dependency-scanpost van 20 oktober, waarin de RefugeeWork website onder "Deploy to fix now" staat met "deploy `acceptance`" en `payload@3.86.0` critical → `3.90.0`; `acceptance` bevat `payload` 3.90.2. Toon het plan voor de ene go.
