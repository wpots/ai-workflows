# Feat: Compound the Loop — Check + Eval + Solution Note per Learning

## Status

done

## Priority

medium

## Summary

`improve-skill` folds learnings into skill prose, but prose evaporates under
pressure — the same rebase pitfall shipped a half-resolved CHANGELOG twice in
one day despite a written procedure. Adopt Every's compound-engineering rule:
every failure becomes every artifact it deserves — a mechanical check where
detectable, an eval where behavioral, and a project-local solution note that
planning skills read back. Close the loop both ways: capture AND resurface.

## User Story

As a team using the AI stack, I want lessons pressed into checks, evals, and
searchable notes, so that a mistake made once cannot silently recur and
planning is grounded in what already went wrong here.

## Acceptance Criteria

- [x] `skills/improve-skill` gains a compound step: per durable learning,
      decide check / eval / solution note in addition to the prose edit, and
      report which artifacts were produced.
- [x] Solution-note format defined where it is written:
      `docs/solutions/<slug>.md` — symptom, root cause, fix, prevention.
- [x] `skills/backlog`, `skills/refinement`, and `skills/work-backlog` read
      `docs/solutions/` as grounding (Related reference, per-ticket notes,
      pre-implementation scan respectively).
- [x] Exemplar check shipped in the same MR: `validate-skills.mjs` errors on
      committed conflict markers (opener/closer lines only — a bare
      `=======` can be a setext underline), because rebase bypasses the
      pre-commit hook.
- [x] Plugin bumped to 1.13.0 with a changelog entry.

## Technical Notes

- Pattern source: Every's compound engineering ("every failure becomes a
  test, a rule update, and an eval") — July 2026 AI stack review, T6.
- The marker check reads every tracked file; the repo is small text files,
  so the cost is negligible next to the existing per-file link scans.
- Deliberately NOT a global learnings database: notes live per project where
  the context is, and the shared repo absorbs only what generalizes (via
  upstream-rules, as always).

## Out of Scope

- An eval runner (T4 — separate task).
- Retroactively writing solution notes for past incidents.
- Cross-project aggregation of solutions.

## Related

- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
