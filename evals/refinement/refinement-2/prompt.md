---
tags: [refinement, routing, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Routing, should not fire: 'refine' here means rewriting code, not a backlog refinement, so the run never invokes the refinement skill."
---

Refine this function so it is easier to read:

```ts
function f(a: number[]) { let r = 0; for (let i = 0; i < a.length; i++) { if (a[i] % 2 === 0) { r = r + a[i]; } } return r; }
```
