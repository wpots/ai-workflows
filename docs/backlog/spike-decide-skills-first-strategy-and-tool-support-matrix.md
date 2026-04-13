# Spike: Decide Skills-First Strategy And Tool Support Matrix

## Status

draft

## Ticket

AIW-110

## Priority

high

## Summary

Decide whether `ai-workflows` should formally adopt a skills-first strategy for repeatable workflows, and define a clear support matrix showing which workflow surfaces are first-class for GitHub Copilot, Cursor, Codex, and Claude.

## User Story

As a maintainer of `ai-workflows`, I want an explicit strategy for skills, rules, and commands, so that the repo evolves intentionally instead of mixing abstractions based on historical tool differences.

## Acceptance Criteria

- [ ] A canonical support matrix is defined for `rules`, `skills`, `commands`, and tool adapters across GitHub Copilot, Cursor, Codex, and Claude.
- [ ] The repo makes an explicit decision on Claude skill support: first-class, experimental, or not part of the primary architecture.
- [ ] The role of each surface is documented clearly:
  - `rules/` as reusable policy
  - `skills/` as reusable multi-step workflows
  - `commands/` as compatibility adapters and fallback runbooks
  - tool adapters as always-on entry points
- [ ] The current ambiguity between repo messaging and sync behavior is identified and resolved or deliberately documented.
- [ ] A shortlist of workflow candidates that should move toward skills-first is produced.
- [ ] The spike recommends whether future workflow investments should default to skill-first for supported tools while preserving Copilot-compatible fallbacks.

## Technical Notes

The repo already leans in this direction, but the architecture is not fully explicit yet:

- [AGENTS.md](/Users/wietekepots/Web/ai-workflows/AGENTS.md) says skills are the primary dispatch mechanism for repeatable workflows.
- The same file still frames commands as necessary for non-skill-aware tools such as Copilot and Claude CLI.
- [scripts/sync.sh](/Users/wietekepots/Web/ai-workflows/scripts/sync.sh) currently syncs skills to Cursor, Codex, and Claude, which suggests a broader skill strategy than the docs currently guarantee.

Review at least:

- [AGENTS.md](/Users/wietekepots/Web/ai-workflows/AGENTS.md)
- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [scripts/sync.sh](/Users/wietekepots/Web/ai-workflows/scripts/sync.sh)
- [templates/project-AGENTS.md](/Users/wietekepots/Web/ai-workflows/templates/project-AGENTS.md)
- [templates/project-CLAUDE.md](/Users/wietekepots/Web/ai-workflows/templates/project-CLAUDE.md)
- [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md)

Suggested decision output:

| Surface | Best use |
| --- | --- |
| `rules/` | stable policy and standards |
| `skills/` | repeatable, tool-assisted workflows |
| `commands/` | Copilot-compatible runbooks and fallback dispatch |
| adapters | always-on routing and precedence |

Candidate workflows to evaluate for stronger skill-first treatment:

- code review
- run checks
- init project
- scaffold component
- upstream rules

## Out of Scope

- Rewriting all existing commands into skills in one pass
- Removing Copilot support
- Designing new external tool integrations

## Related

- [AGENTS.md](/Users/wietekepots/Web/ai-workflows/AGENTS.md)
- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [scripts/sync.sh](/Users/wietekepots/Web/ai-workflows/scripts/sync.sh)
- [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md)
