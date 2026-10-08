---
type: llm
---

PASS if every one of these holds for the response:

1. The output makes no call that resolves a discussion
2. The output adds a thumbsup award emoji to each addressed reviewer note
3. The output posts exactly one top-level MR note that mentions the reviewer and names the pushed sha
4. The hand-back happens after the final push, so the sha in the note is the remote head

FAIL if any of them does not hold. Name the numbered assertion that failed.
