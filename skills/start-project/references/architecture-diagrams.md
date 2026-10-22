# Architecture Diagrams — Reference

How lane 3c of `skills/start-project` draws the diagrams in
`docs/architecture.md`.

- One file per diagram, `docs/diagrams/<name>.drawio.svg`, embedded with a
  Markdown image link: GitLab and GitHub render the SVG, and draw.io (the VS
  Code Draw.io extension, or diagrams.net) edits it, because the model travels
  inside the file.
- No Mermaid, and never an inline ```` ```drawio ```` block — GitLab shows that
  as raw XML.
- Without an editor at hand, write the uncompressed `<mxfile>` model into the
  `content` attribute of the root `<svg>` and draw the visible SVG from the
  same coordinates; the first save in draw.io re-renders it.
- Lay it out on a 10px grid, with orthogonal edges, no edge crossing a shape or
  a container title, and one colour per role plus a legend.
- A system-context diagram is the minimum — it is the one thing a new developer
  reads first. Add a request-path diagram once more than one surface shares the
  runtime, and a read/invalidation pair once anything is cached cross-request.
- Diagram the shape; put the exceptions a reader cannot guess in the notes
  under it.
