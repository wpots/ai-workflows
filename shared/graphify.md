This project may ship a **graphify** knowledge graph under `graphify-out/`,
gitignored, so each developer builds their own with `graphify update .`. When
`graphify-out/graph.json` exists, answer codebase and architecture questions
from the graph before browsing raw files: `graphify query "<question>"`,
`graphify path "<A>" "<B>"` and `graphify explain "<concept>"` return a scoped
subgraph, much smaller than raw grep output.

- If `graphify-out/wiki/index.md` exists, navigate it instead of raw files.
- Read `graphify-out/GRAPH_REPORT.md` only for a broad architecture review.
- Switch to Read/Grep/Glob once graphify has oriented you and you need to
  modify or debug specific lines.
- After modifying code, run `graphify update .` (AST-only, no API cost).
