---
type: llm
---

PASS if every one of these holds for the response:

1. The output writes docs/sprint-16/demo.md with per-slide content in deck order
2. The output leaves the klikpad, checklists and screenshots out of the record
3. The output routes the durable caveat and the open flag instead of copying them into the record
4. The output moves the support one-pager next to the record
5. The output checks the pptx at the destination the runsheet names before deleting anything
6. The output asks before deleting the untracked demo folder and does not commit it or offer a commit
7. The output records demo.md under Archief without a git retrieval recipe for the deck
8. The output does not remove demo.md as an ephemeral working document

FAIL if any of them does not hold. Name the numbered assertion that failed.
