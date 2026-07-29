# Workflow Canonical Sources

This document tracks which workflow surface is canonical for each reusable workflow in `ai-workflows`.

Use it to decide where updates should land first and whether a command is a full implementation or only a compatibility wrapper.

## Current Inventory

| Workflow | Current surfaces | Canonical source | Fallback / compatibility surface | Normalized |
| --- | --- | --- | --- | --- |
| `commit-message` | skill + command | `skills/commit-message/SKILL.md` | `commands/commit-message.md` | yes |
| `create-pr` | skill + command | `skills/create-pr/SKILL.md` | `commands/create-pr.md` | yes |
| `code-review` | skill + command | `skills/code-review/SKILL.md` | `commands/review-code.md` | yes |
| `run-checks` | skill + command | `skills/run-checks/SKILL.md` | `commands/run-checks.md` | yes |
| `init-project` | skill + command | `skills/init-project/SKILL.md` | `commands/init-project.md` | yes |
| `scaffold-component` | skill + command | `skills/scaffold-component/SKILL.md` | `commands/scaffold-component.md` | yes |
| `component-spec` | skill only | `skills/component-spec/SKILL.md` | none | n/a |
| `architecture-review` | skill only | `skills/architecture-review/SKILL.md` | none | n/a |
| `upstream-rules` | skill only | `skills/upstream-rules/SKILL.md` | none | n/a |
| `new-device-setup` | command only | `commands/new-device-setup.md` | none | n/a |
| `safe-kill-port` | command only | `commands/safe-kill-port.md` | none | n/a |
| `backlog` | skill + command | `skills/backlog/SKILL.md` | `commands/backlog.md` | yes |
| `close-sprint` | skill + command | `skills/close-sprint/SKILL.md` | `commands/close-sprint.md` | yes |
| `refinement` | skill + command | `skills/refinement/SKILL.md` | `commands/refinement.md` | yes |
| `sprint-demo` | skill + command | `skills/sprint-demo/SKILL.md` | `commands/sprint-demo.md` | yes |
| `sprint-planning` | skill + command | `skills/sprint-planning/SKILL.md` | `commands/sprint-planning.md` | yes |
| `work-backlog` | skill + command | `skills/work-backlog/SKILL.md` | `commands/work-backlog.md` | yes |
| `address-review-comments` | skill only | `skills/address-review-comments/SKILL.md` | none | n/a |
| `sprint-board` | skill only | `skills/sprint-board/SKILL.md` | none | n/a |
| `jira-ticket` | skill only | `skills/jira-ticket/SKILL.md` | none | n/a |
| `npm-maintenance` | skill only | `skills/npm-maintenance/SKILL.md` | none | n/a |
| `maintenance` | skill only | `skills/maintenance/SKILL.md` | none | n/a |
| `improve-skill` | skill only | `skills/improve-skill/SKILL.md` | none | n/a |
| `sustainable-review` | skill + command | `skills/sustainable-review/SKILL.md` | `commands/sustainable-review.md` | yes |
| `test-driven-development` | skill only | `skills/test-driven-development/SKILL.md` | none | n/a |
| `receiving-code-review` | skill only | `skills/receiving-code-review/SKILL.md` | none | n/a |
| `skill-opportunity` | skill only | `skills/skill-opportunity/SKILL.md` | none | n/a |
| `watch-mrs` | skill only | `skills/watch-mrs/SKILL.md` | none | n/a |
| `wcag-audit` | skill only | `skills/wcag-audit/SKILL.md` | none | n/a |
| `migration-check` | skill only | `skills/migration-check/SKILL.md` | none | n/a |
| `upstream-to-unicore` | skill only | `skills/upstream-to-unicore/SKILL.md` | none | n/a |

## Interpretation

- Canonical source: the workflow artifact that should be updated first.
- Fallback / compatibility surface: the artifact that exists to support tools that cannot rely on the canonical surface.
- Normalized: whether the fallback surface already behaves like a wrapper around the canonical workflow instead of acting as a second full implementation.

## Update Rule

When a workflow has both a skill and a command:

1. Update the skill first.
2. Keep the command aligned as a compatibility wrapper or fallback runbook.
3. Avoid letting the command and skill drift into separate implementations.
