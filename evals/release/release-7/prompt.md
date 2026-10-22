---
tags: [release, runnable]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "RFW-300, RFW-295 and RFW-321 get the label v1.3.0 with existing labels kept, whatever their status: RFW-295 and RFW-321 are reported as partial with the unanswered PO question as the reason. RFW-330 gets nothing and is reported as open, with its draft MR. No status changes. The recap says that Releases and the Fix Version field stay empty because there is no Jira version, and points at the ticket's Labels field and the JQL labels = \"v1.3.0\"."
---

We ronden de release van RefugeeWork versie 1.3.0 af: de tag en de GitLab Release staan er al, nu is de tracker aan de beurt. Het Jira-project heeft geen versies en het aanmaken van een versie geeft 404 "Project with key 'null'", dus het label v1.3.0 is de uitwijk. In de range v1.2.0..v1.3.0 zitten: RFW-300 (de key staat in een commit subject, status Done, de PO schreef "kan naar productie"), RFW-295 (twee gemergde MR's met de key in de titel, status In Acceptance, in de comments staat een onbeantwoorde vraag van de PO), RFW-321 (de key staat in een commit subject, status In Acceptance, ook hier een onbeantwoorde PO-vraag) en RFW-330 (alleen een open draft-MR draagt de key, geen commit of gemergde MR in de range). Welke tickets krijgen het label, wat doe je met hun status, en wat zeg je in de recap over de plek waar de gebruiker het label terugvindt?
