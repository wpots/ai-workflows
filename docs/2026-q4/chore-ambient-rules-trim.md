# Chore: Trim the Two Ambient Rule Files

## Status

<!-- draft | ready | in-progress | done -->

done

Filed and delivered 2026-10-28 on the maintainer's go, right after the
`CLAUDE.md` trim of rank 8 merged.

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 8

## Priority

low

## Summary

Next to `CLAUDE.md`, the plugin installs `rules/project.md` (3.5k tokens) and
`rules/clean-architecture.md` (2k) into `~/.claude/rules/`, so both load into
every session of every teammate. Both state several rules more than once.
`project.md` also opens with a persona line, and contradicts itself on
component length.
This item states each rule once and keeps every heading that a skill or a
stack rule cites.

## User Story

As a teammate, I want the always-on coding rules to state each rule once, so
that every session spends less context on them and no two lines disagree.

## Acceptance Criteria

- `/context` lists both files at fewer tokens than the installed 2.14.3 copies
  (3.5k and 2k).
- Every rule is still there, once. Rules that appeared two or three times
  (`any`, `as`, client components, `React.FC`, local handler style, edge
  validation, the per-layer import lines) appear once.
- The cited headings keep their names: "Shared Layers Are Earned, Not Claimed"
  and "Harden What You Can Demonstrate" in `project.md`, "Conform to the rule,
  not the neighbour" in `clean-architecture.md`. Their text is unchanged.
- The component-length contradiction is resolved in favour of the guideline
  ("discuss with team before enforcing as hard limit").
- `rules/rules.md` still describes both files correctly.
- A changelog fragment; `CHANGELOG.md` and the plugin version untouched.
- `bash scripts/validate-ai-instructions.sh` passes.

## How to verify

`claude -p "/context"` reaches api.anthropic.com, so run it with the sandbox
bypass. It costs no model tokens.

- [x] `cmp` of `gitlab/main:rules/<file>` against
      `~/.claude/rules/<file>`: the installed copies equal `main` for both
      files.
- [x] A scratch directory with this branch's two files under `.claude/rules/`:
      `claude -p "/context" --no-session-persistence` lists the installed
      copies at 3.5k and 2k tokens, and this branch's at **2.8k** and **1.8k**.
- [x] `wc -c`: `project.md` 9,902 → 8,114 bytes, `clean-architecture.md`
      5,577 → 5,191.
- [x] `rg` for the three cited headings across `skills/`, `rules/` and
      `templates/`: each still resolves.
- [x] `bash scripts/validate-ai-instructions.sh` passes (the pre-commit hook on
      the delivery commit).

## Technical Notes

- `project.md`:
  - Forbidden Patterns is gone. Each item already stood in its section; the
    two that did not (inline styles, Shadcn/Radix) move into Component Design.
  - Props Destructuring folds into Component Design.
  - Function Style drops its repeats of `React.FC` and local handler style.
  - Formatting defaults become one sentence; i18n and Documentation become one
    line each.
  - The Server Actions co-location bullet repeats "Shared Layers Are Earned"
    and goes.
  - Freek's GraphQL alias rule keeps its example and reason, in two fewer
    sentences.
- `clean-architecture.md`:
  - The per-layer "Must not / May import from" lines fold into the dependency
    table, keeping their nuances (no framework in Domain; Infrastructure
    implements Domain's interfaces; Application reaches Infrastructure via
    domain interfaces).
  - The two import-only examples become bullets: the table already forbids
    them.
  - The three code examples a reader cannot get from the table stay.
- `architecture-review` cites the layer and pattern names in prose, not as
  headings, so the renamed "Dependency Rule" heading and the merged import
  examples break no reference.

## Out of Scope

- Scoping `project.md` to frontend files with `paths:`. That would save its
  full cost outside TypeScript projects. But Greenberry code is mostly written
  in a sibling worktree, where a `paths:` pattern relative to the session's
  project may not match, and the coding rules would go silently missing. That
  needs a test and her decision first.
- The text of the cited sections: Shared Layers, Harden What You Can
  Demonstrate, Conform to the rule.

## Related

- [../../rules/project.md](../../rules/project.md)
- [../../rules/clean-architecture.md](../../rules/clean-architecture.md)
- [../../rules/rules.md](../../rules/rules.md)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/314
