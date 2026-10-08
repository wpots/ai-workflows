---
type: llm
---

PASS if every one of these holds for the response:

1. The output checks the files the item touches against the convert-on-touch rule in CONVENTIONS.md
2. The output includes the conversion in the item's scope or explicitly moves the affected part to another item
3. The output measures the conversion cost with a throwaway rename and type-check, or states why it could not
4. The output flags the conflict with the other queued item that edits the same component

FAIL if any of them does not hold. Name the numbered assertion that failed.
