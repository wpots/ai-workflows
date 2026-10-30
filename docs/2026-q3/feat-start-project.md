# Feature: Start-project Skill

## Status

done

Readiness pass 2026-07-29 — blocked on maintainer decisions: the content
contracts for the three project documents (brief / spec / architecture) are
product-shaping calls, and an autonomous run cannot satisfy the improve-skill
RED rule (no fresh project to watch the baseline fail in), so this needs a
human-driven first run. Gap to add when picking this up: `init-project` gets
no AC preventing it from re-deriving structure when `docs/architecture.md`
exists, so the two documents can drift; `skills/architecture-review` also
never reads `docs/architecture.md`.

Delivered 2026-07-29. Maintainer decisions taken at pickup:

1. **Content contracts** — derived from the RefugeeWork website, which already
   runs on `docs/project-brief.md` and `docs/project-spec.md`; those two
   documents' section structure is the contract. No precedent existed for the
   architecture doc.
2. **Architecture doc scope** — the full document (layer mapping + data model +
   trust boundaries + deployment topology + ADR log), not a decision log only.
   The drift risk that follows is closed on the consumer side instead: the
   `init-project` and `architecture-review` gaps named above are fixed in the
   same MR, so `docs/architecture.md` is the single master of the intended
   mapping and `CONVENTIONS.md` links to it.
3. **Run modes** — fresh template clone *and* retrofit on an existing codebase
   (RFW is the second case), with a harvest-before-asking step so a retrofit
   confirms facts instead of re-answering them.

Still open: the RED rule. This skill has not yet run against a real fresh
project, so run `skills/improve-skill` after the first live kickoff.

## Priority

medium

## Summary

A kickoff skill for a fresh project cloned from the unicore template: capture intent
before tooling. Interview the developer, then write `docs/project-brief.md`,
`docs/project-spec.md`, and `docs/architecture.md`, and only then hand over to
`skills/init-project` for `CONVENTIONS.md` and the tool adapters.

## User Story

As a developer starting a new project from the template, I want the brief, the
functional spec, and the architecture decisions written down on day one, so that every
later ticket, review, and agent session can be grounded in them instead of in someone's
memory of the kickoff call.

## Acceptance Criteria

- [ ] New `skills/start-project/SKILL.md` with valid frontmatter and a `Use when …`
      routing cue ("start project", "new project", "project kickoff", "na de unicore
      template").
- [ ] Elicits the missing information in grouped rounds instead of one long
      questionnaire, and never invents stakeholders, goals, or scope.
- [ ] Writes `docs/project-brief.md`: why, stakeholders, target users, goals and how
      they are measured, scope and explicit non-scope, constraints, key risks.
- [ ] Writes `docs/project-spec.md`: functional scope (epics/features), content model,
      non-functionals (accessibility, performance, sustainability, i18n, SEO),
      integrations, environments.
- [ ] Writes `docs/architecture.md`: Clean Architecture layer mapping for this
      project, trust boundaries, data model, deployment topology, and a decision log
      (ADR-style entries with the rationale).
- [ ] New templates `templates/project-brief.md`, `templates/project-spec.md`, and
      `templates/project-architecture.md` back those three documents.
- [ ] Hands over to `skills/init-project` for `CONVENTIONS.md`, the thin adapters, and
      the shared-asset sync — it does not duplicate stack detection.
- [ ] **Boundary is explicit in the skill body**: `docs/architecture.md` holds
      decisions and rationale; `CONVENTIONS.md` holds detected stack facts. No
      duplicated structure section, so the two cannot drift apart.
- [ ] Never overwrites an existing brief, spec, or architecture doc without asking.
- [ ] Listed in `docs/workflow-canonical-sources.md` and placed in
      `docs/pipeline-map.md`.

## Technical Notes

`skills/init-project` is detection work — read `package.json`, map folders to layers,
flag deviations. This skill is intent work, and runs before it. Keeping them separate
also keeps `init-project` usable on existing codebases.

The three documents feed the phases that are currently weakest: `docs/project-spec.md`
gives the Design-readiness and Definition-of-ready gates something concrete to check
against, and `docs/architecture.md` gives `skills/architecture-review` the intended
mapping instead of only the inferred one.

Follow-up once this lands: `skills/upstream-to-unicore` can ship the three templates
into `unicore-template` as stubs, so a fresh clone already has the empty structure.

## Out of Scope

- Cloning or configuring the template itself.
- Generating `CONVENTIONS.md` (owned by `skills/init-project`).
- Creating tickets or a backlog from the spec — that is `skills/backlog` and
  `skills/jira-ticket`.

## Related

- [../../skills/init-project/SKILL.md](../../skills/init-project/SKILL.md)
- [../../skills/architecture-review/SKILL.md](../../skills/architecture-review/SKILL.md)
- [../../skills/upstream-to-unicore/SKILL.md](../../skills/upstream-to-unicore/SKILL.md)
- [../../rules/clean-architecture.md](../../rules/clean-architecture.md)
- [../pipeline-map.md](../pipeline-map.md)
