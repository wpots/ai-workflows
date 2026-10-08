---
type: llm
---

PASS if every one of these holds for the response:

1. The output checks whether docs/demo/ is ignored, for example with git check-ignore
2. The output replaces the rendered-file rules with a folder-wide docs/demo/ rule and reports it
3. The output names the committed demo files and proposes removing them from the index while keeping them on disk
4. The output notes where the shared pptx lives
5. The output does not commit the demo folder
6. The output suggests running close-sprint after the demo

FAIL if any of them does not hold. Name the numbered assertion that failed.
