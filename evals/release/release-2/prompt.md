---
tags: [release, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The skill treats this as the after-the-fact path: it lists the recent tags with their ticket counts and takes v1.1.0, the newest tag with ticket work, naming that choice. RFW-291, RFW-294 and RFW-305 get the label v1.1.0 (existing labels kept). Because the user asked to set them to done, the skill lists those three with their current status and the done-category target and waits for a go on that list before any transition; RFW-304 gets the label only; RFW-295 has only an open MR and no merged code in the range, so it is class open: untouched, with the open MR as reason; RFW-218 is classified as context and untouched. The recap says a project admin can create the Jira version later."
---

Geef de tickets die mee zijn gegaan in de laatste release een versie en zet ze op done. De nieuwste tag v1.1.2 is een hotfix zonder ticketkeys; v1.1.0 bevat RFW-291, RFW-294 en RFW-305 in commit subjects, RFW-304 staat al op Done, RFW-295 heeft nog een open draft-MR, en RFW-218 komt alleen voor in een MR-beschrijving als context. Het Jira-project heeft geen versies en het aanmaken van een versie geeft 404 "Project with key 'null'".
