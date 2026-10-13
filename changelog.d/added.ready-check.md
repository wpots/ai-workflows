- `backlog` gains a ready check: asked whether an item or a sprint's items are
  ready, it holds them against the new Definition of Ready in
  `rules/backlog.md`, puts open product questions to the developer one at a
  time, and writes a `Blocked on:` and `Next step:` line on every item that is
  not ready. It proposes the rest; the developer confirms the flip to `ready`,
  the gate after which `work-backlog` may build unattended. Description change;
  `backlog` has no routing cases.
