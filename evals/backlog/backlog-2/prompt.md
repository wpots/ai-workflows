---
tags: [backlog, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run opens the proof-of-concept app before probing the API, captures which request each form field sends, and uses that list to decide what to measure. It then measures those fields against the API and records where the reference's choices do not hold (a field name the API ignores, for instance) instead of copying them into the criteria. The recap says the reference was read first and which of its choices were verified or rejected."
---

Refine the advanced-search item so it can be flipped to ready. (Repo context the agent can discover: the item and an ADR both name the client's proof-of-concept app as the form reference, with its URL; the vendor API is reachable with the project's credentials; nobody has opened the proof of concept yet.)
