- `start-project` and the architecture template now prescribe draw.io instead
  of Mermaid: one `docs/diagrams/<name>.drawio.svg` per diagram, embedded with
  a Markdown image link, so GitLab renders it and draw.io edits it. Inline
  ```` ```drawio ```` blocks are ruled out because GitLab shows them as raw XML.
  The skill says how to write one without an editor (model in the SVG's
  `content` attribute, render drawn from the same coordinates) and sets layout
  rules: 10px grid, orthogonal edges, no crossings, one colour per role with a
  legend.
