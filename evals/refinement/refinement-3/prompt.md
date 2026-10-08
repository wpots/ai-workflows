---
tags: [refinement, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Phase 0 holds: a live tracker connection is a hard precondition, and refining on pasted text gives estimates on possibly stale information. The run does not group or size the pasted tickets; it stops, says the tracker has to be connected first, and tells the user how (the jira CLI: brew install, jira init, verify with jira me)."
---

On Thursday we refine these three tickets with the team. Jira isn't connected in this session, so I pasted them below. Prepare the refinement from this text.

- SHOP-31 Wishlist page: logged-in customers can save products and see them on /wishlist.
- SHOP-32 Show stock per store on the product page.
- SHOP-33 Wishlist: share a wishlist with a link.
