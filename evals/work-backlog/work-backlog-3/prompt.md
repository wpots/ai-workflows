---
tags: [work-backlog, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "WIP limit 1: the open MR with unresolved reviewer threads is this run's work. The run does not pick SHOP-15, even though it is the ready critical item, and does not open a second MR. It reworks !57 (address-review-comments in full-auto mode), resolves the threads it addressed, and stops after that instead of moving on to a new item."
---

Pick up the next backlog item. You can't run git or glab here, so work from this state, which I checked a minute ago:

- `docs/backlog/` holds `SHOP-15-bug-price-rounding.md` (Status ready, Priority critical, no dependencies), `SHOP-12-feat-cart-2-ui.md` (Status in-progress) and `SHOP-20-feat-wishlist.md` (Status draft, Priority critical).
- MR !57 from branch `cart/ui`, which delivers `SHOP-12-feat-cart-2-ui.md`, is open. The reviewer, anna.devries, left two unresolved threads on it this morning: one asks to move the price formatting out of the component, the other asks for a test of the empty-cart state.
- No other MRs are open, and there are no local branches without an MR.

What does this run do?
