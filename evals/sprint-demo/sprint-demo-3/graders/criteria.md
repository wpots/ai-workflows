---
type: llm
---

PASS if every one of these holds for the response:

1. The output does not overwrite deck.md with an earlier generated version
2. The output removes the commented-out slides from the pptx
3. The output detects the empty slide left by the commented-out block and reports it
4. The output compares pptx and deck.md in both directions
5. The output renders and inspects the changed pptx slides before reporting

FAIL if any of them does not hold. Name the numbered assertion that failed.
