---
tags: [watch-mrs, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run evaluates the comment, recognises that it rejects the MR's architecture (where redirects and 404s are decided), and asks the user that one decision before changing code, instead of either applying a rewrite on its own or only relaying the comment."
---

You are watching my open MR !82 in `acme/template` with the watch-mrs loop, in act mode: act on review comments yourself unless a crucial decision is involved. The watcher just emitted:

```
!82 new comment by reviewer: This doesn't belong in the proxy: a DB lookup on every request is slow and gives a 500 on every page when the database is down. Prerender the page with "use cache" + cacheTag so notFound()/redirect() keep their status, and drop the proxy lookups.
```

(Context the agent can discover: the MR's whole design decides redirects and 404s in `src/proxy.ts` with two uncached database queries per request; the reviewer's alternative replaces that design.)
