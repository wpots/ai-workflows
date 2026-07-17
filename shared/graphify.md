This project may ship a **graphify** knowledge graph under `graphify-out/`
(god nodes, community structure, and cross-file relationships). The graph data
is gitignored, so each developer builds their own with `graphify update .`.

When `graphify-out/graph.json` exists, prefer the graph over raw file browsing
for codebase and architecture questions:

- `graphify query "<question>"` — scoped subgraph for any codebase or architecture question
- `graphify path "<A>" "<B>"` — dependency path between two symbols
- `graphify explain "<concept>"` — all nodes related to a concept

These return a scoped subgraph, usually much smaller than raw grep output or `GRAPH_REPORT.md`.

- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review when query/path/explain do not surface enough context.
- Use direct Read/Grep/Glob once graphify has oriented you and you need to modify or debug specific lines, or when `graphify-out/graph.json` does not exist yet.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
