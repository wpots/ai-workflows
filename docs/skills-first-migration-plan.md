# Skills-First Migration Plan

This is a decision record. The migration it planned is done; what stays is what
was decided and the model it left behind.

## Decision Record (2026-07-27)

Phase 1 is decided:

- **Supported tools:** Codex, Claude, and GitHub Copilot; Roo is dropped as a
  sync target. Cursor was on this list until 2026-10-08 (see the amendment).
- **Claude skill status: first-class.** Skills are the canonical workflow
  surface on Claude and ship via the `greenberry` plugin from this repo's
  marketplace (`.claude-plugin/`, root-as-plugin). Commands stay as the
  Copilot and fallback surface.
- **Claude distribution:** skills/commands come from the plugin and
  auto-update; `~/.claude/CLAUDE.md` and the universal rules subset stay on
  global sync because plugins have no primitive for always-on context.

## Amendment (2026-10-08)

- **Cursor is out.** The team uses Claude and Codex. Cursor no longer counts as
  a supported tool: its adapters (`.cursor/rules/*.mdc`, `.cursor/mcp.json`) are
  still generated and get no further work. Removing them from sync got its go
  on 2026-10-13, in three slices starting with
  [`chore-retire-cursor-adapters-1-stop-emitting.md`](backlog/chore-retire-cursor-adapters-1-stop-emitting.md).
  `.cursor/` files that synced projects already hold are left alone.
- Nothing else in the 2026-07-27 record changes.

## Goal

Move `ai-workflows` toward a clearer skills-first model for repeatable workflows while keeping:

- `rules/` as the canonical policy library
- `commands/` as compatibility adapters and fallback runbooks
- tool adapters as the always-on entry points

This plan assumes that not all tools support skills equally well, so the migration is about clarifying responsibilities, not forcing one abstraction onto every tool.

## Recommended End State

Use this target model:

| Surface | Primary responsibility |
| --- | --- |
| `rules/` | durable coding standards and policy |
| `skills/` | repeatable multi-step workflows for skill-aware tools |
| `commands/` | Copilot-friendly runbooks and fallback dispatch |
| `templates/*` and adapters | always-on routing, precedence, and local usage guidance |

Tool support target:

| Tool | Always-on entry point | Workflow strategy |
| --- | --- | --- |
| GitHub Copilot | `.github/copilot-instructions.md` | command/runbook-first, no skills dependency |
| Cursor | `AGENTS.md` plus `.cursor/rules/*.md` | not used by the team; adapters generated, no further work (2026-10-08) |
| Codex | `AGENTS.md` | skill-first where possible, commands as fallback |
| Claude | `CLAUDE.md` plus global/project rules | skill-first via the `greenberry` plugin, commands as fallback (decided 2026-07-27) |

## Principles

1. Do not replace rules with skills.
   Rules are reference policy. Skills should load rules when relevant, not absorb them wholesale.
2. Do not remove command runbooks for Copilot compatibility.
   Copilot still needs direct, prompt-friendly runbooks.
3. Prefer one canonical workflow source per workflow.
   If a skill becomes the canonical implementation, the command should become a compatibility wrapper or fallback summary rather than a second independently evolving workflow.
4. Keep always-on instructions compact.
   Do not compensate for missing workflow structure by bloating adapters or baseline rules.

## Phases

| Phase | Outcome | Where it landed |
| --- | --- | --- |
| 1. Decide the support matrix | decided 2026-07-27, amended 2026-10-08 | the decision record above; the matrix in [`AGENTS.md`](../AGENTS.md), [`README.md`](../README.md), [`FEATURES.md`](../FEATURES.md) and [`templates/project-ai-workflows.md`](../templates/project-ai-workflows.md) |
| 2. Classify existing assets | done | [`workflow-canonical-sources.md`](workflow-canonical-sources.md) names one canonical source per workflow |
| 3. Normalize skill-first workflows | done | skills are canonical and commands remain as fallback runbooks; the skill-mapping rows in `CLAUDE.md` name both |
| 4. Tighten rule usage | standing practice | principles 1 and 4 above; it has no deliverable of its own |
| 5. Align sync and documentation | done | `scripts/sync.sh --project` and `templates/project-ai-workflows.md` follow the matrix |

## Recommended Default Going Forward

For new work:

- new policy -> add or update a rule file
- new multi-step reusable workflow -> create a skill first
- Copilot support for that workflow -> add a command/runbook wrapper
- always-on behavior -> keep it in adapters or compact shared fragments only if it is broadly universal

This gives the repo a cleaner contract:

- rules explain what good looks like
- skills explain how to execute repeatable workflows
- commands keep less capable tools usable
