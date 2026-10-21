---
tags: [release, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The skill recognises the V1.5.0 thread as another client's release mail and uses it only as a model for the subject form and the wording. It does not offer that thread's addresses as the recommended recipients. It asks who gets the mails with no recommended option, and accepts 'leave them empty, I fill them in' by planning drafts without To or Cc."
---

Release starten voor RefugeeWork. docs/release-process.md beschrijft een fast-forward van acceptance naar main en CONVENTIONS.md heeft geen "Release communication"-regel. In Gmail geeft `in:sent subject:release newer_than:180d` één thread: "Release V1.5.0", verstuurd op 6 oktober naar zes adressen bij oba.nl en greenberry.nl, over de website van OBA. Er is nog nooit een releasemail voor RefugeeWork verstuurd.
