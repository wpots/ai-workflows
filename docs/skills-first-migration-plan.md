# Skills-First Migration Plan

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
| Cursor | `AGENTS.md` plus `.cursor/rules/*.md` | skill-first where possible, commands as fallback |
| Codex | `AGENTS.md` | skill-first where possible, commands as fallback |
| Claude | `CLAUDE.md` plus global/project rules | decide explicitly whether skills are first-class or fallback-only |

## Principles

1. Do not replace rules with skills.
   Rules are reference policy. Skills should load rules when relevant, not absorb them wholesale.
2. Do not remove command runbooks for Copilot compatibility.
   Copilot still needs direct, prompt-friendly runbooks.
3. Prefer one canonical workflow source per workflow.
   If a skill becomes the canonical implementation, the command should become a compatibility wrapper or fallback summary rather than a second independently evolving workflow.
4. Keep always-on instructions compact.
   Do not compensate for missing workflow structure by bloating adapters or baseline rules.

## Phase 1: Decide The Support Matrix

Goal: remove architecture ambiguity before migrating workflows.

Actions:

- Publish an explicit support matrix in repo docs.
- Decide Claude’s official skill status:
  - first-class
  - experimental
  - unsupported as a primary abstraction
- Make the repo wording consistent with the chosen answer.

Primary files:

- [AGENTS.md](../AGENTS.md)
- [README.md](../README.md)
- [scripts/sync.sh](../scripts/sync.sh)
- [templates/project-ai-workflows.md](../templates/project-ai-workflows.md)

Exit criteria:

- A contributor can tell, without inference, which tools are skill-first, command-first, or mixed.

## Phase 2: Classify Existing Assets

Goal: assign each current workflow asset to the right abstraction.

Classify every major workflow into one of these buckets:

- policy-only: belongs in `rules/`
- workflow-first: belongs in `skills/`
- compatibility-only: belongs in `commands/`
- dual-surface: skill as canonical, command as fallback wrapper

Recommended initial classification:

| Workflow | Recommendation |
| --- | --- |
| `commit-message` | dual-surface |
| `create-pr` | dual-surface |
| `experimental.code-review` | skill-first |
| `experimental.run-checks` | skill-first |
| `experimental.scaffold-component` | skill-first |
| `experimental.init-project` | skill-first |
| `experimental.upstream-rules` | skill-first |

Exit criteria:

- Each workflow has one declared canonical source.

## Phase 3: Normalize Skill-First Workflows

Goal: reduce drift between skills and commands.

Actions:

- For each skill-first workflow, shorten the matching command into a compatibility runbook that:
  - names the skill when supported
  - preserves a fallback procedure for non-skill-aware tools
  - avoids becoming a second full implementation
- Align trigger phrases and summaries across:
  - `skills/*/SKILL.md`
  - `commands/*.md`
  - `shared/command-mappings.md`
  - project adapters

Good first candidates:

- `experimental.code-review`
- `experimental.run-checks`
- `experimental.init-project`

Exit criteria:

- The skill is clearly the canonical workflow for supported tools.
- The command remains useful for Copilot and fallback tools without duplicating the full logic.

## Phase 4: Tighten Rule Usage

Goal: make rules easier for skills and developers to apply consistently.

Actions:

- Keep `rules/` as a focused library of policy files.
- Make sure skills explicitly load or reference the rule files they depend on.
- Keep compact baseline guidance in always-on adapters only when it is truly universal.
- Add small, high-signal examples showing when developers should explicitly mention a focused rule in prompts.

This phase is successful when:

- rules are not trying to be workflows
- skills are not trying to be full policy handbooks
- contributors know when to name a rule explicitly

## Phase 5: Align Sync And Documentation

Goal: make the strategy visible in the actual synced experience.

Actions:

- Ensure `sync.sh` and generated project files reflect the chosen support matrix.
- Keep `AI-WORKFLOWS.md` explicit about:
  - always-on vs on-demand
  - skills vs commands
  - per-tool expectations
- Update maintainer docs so new workflow additions follow the same model by default.

Primary files:

- [scripts/sync.sh](../scripts/sync.sh)
- [README.md](../README.md)
- [templates/project-ai-workflows.md](../templates/project-ai-workflows.md)

## Risks

- Claude ambiguity: syncing skills to Claude without officially supporting a skills-first model creates architecture drift.
- Duplicate maintenance: if commands and skills both remain full implementations, the repo will drift quickly.
- Overusing skills: trying to turn static policy into skills will make standards less discoverable and harder to reuse.
- Under-documenting Copilot fallback: if commands get too thin without a real fallback path, Copilot users lose functionality.

## Suggested Execution Order

1. Complete the support-matrix decision.
2. Mark canonical workflow sources for existing assets.
3. Normalize the top 3 highest-value workflows to skill-first plus command fallback.
4. Refresh docs and templates to match the chosen model.
5. Revisit the remaining experimental workflows.

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
