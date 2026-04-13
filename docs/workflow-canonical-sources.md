# Workflow Canonical Sources

This document tracks which workflow surface is canonical for each reusable workflow in `ai-workflows`.

Use it to decide where updates should land first and whether a command is a full implementation or only a compatibility wrapper.

## Current Inventory

| Workflow | Current surfaces | Canonical source | Fallback / compatibility surface | Normalized |
| --- | --- | --- | --- | --- |
| `commit-message` | skill + command | `skills/commit-message/SKILL.md` | `commands/commit-message.md` | yes |
| `create-pr` | skill + command | `skills/create-pr/SKILL.md` | `commands/create-pr.md` | yes |
| `experimental.code-review` | skill + command | `skills/experimental.code-review/SKILL.md` | `commands/experimental.review-code.md` | yes |
| `experimental.run-checks` | skill + command | `skills/experimental.run-checks/SKILL.md` | `commands/experimental.run-checks.md` | yes |
| `experimental.init-project` | skill + command | `skills/experimental.init-project/SKILL.md` | `commands/experimental.init-project.md` | yes |
| `experimental.scaffold-component` | skill + command | `skills/experimental.scaffold-component/SKILL.md` | `commands/experimental.scaffold-component.md` | yes |
| `experimental.component-spec` | skill only | `skills/experimental.component-spec/SKILL.md` | none | n/a |
| `experimental.architecture-review` | skill only | `skills/experimental.architecture-review/SKILL.md` | none | n/a |
| `experimental.upstream-rules` | skill only | `skills/experimental.upstream-rules/SKILL.md` | none | n/a |
| `experimental.new-device-setup` | command only | `commands/experimental.new-device-setup.md` | none | n/a |
| `experimental.safe-kill-port` | command only | `commands/experimental.safe-kill-port.md` | none | n/a |

## Interpretation

- Canonical source: the workflow artifact that should be updated first.
- Fallback / compatibility surface: the artifact that exists to support tools that cannot rely on the canonical surface.
- Normalized: whether the fallback surface already behaves like a wrapper around the canonical workflow instead of acting as a second full implementation.

## Update Rule

When a workflow has both a skill and a command:

1. Update the skill first.
2. Keep the command aligned as a compatibility wrapper or fallback runbook.
3. Avoid letting the command and skill drift into separate implementations.
