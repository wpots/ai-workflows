---
type: llm
---

PASS if every one of these holds for the response:

1. The output searches the rendered deck.html for the left-out slides' text instead of relying on the slide count
2. The output names the slide whose presenter notes carry the left-out text
3. The output proposes moving the left-out slides to parked-slides.md instead of keeping them commented out
4. The output waits for the user's go before writing to deck.md

FAIL if any of them does not hold. Name the numbered assertion that failed.
