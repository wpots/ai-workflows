- `skills/improve-skill` now marks when a learning stops being true. A learning
  that rests on an outside fact (a tool flag, a platform limit, a version, a
  branch line, a sandbox rule) names that fact, the date it was checked, and
  what would make it false. A repo convention is marked permanent.
  - Before an edit, the retrospective reads the existing pitfalls in that area
    and removes the ones whose condition no longer holds.
  - The report gives each learning its condition and lists the removals.
  - Solution notes gain a fifth part, "retire when".
  <!-- slack: improve-skill | learnings zeggen wanneer ze niet meer kloppen, zodat verouderde regels eruit gaan -->
