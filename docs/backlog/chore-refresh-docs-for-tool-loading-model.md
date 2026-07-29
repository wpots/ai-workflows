# Chore: Refresh Docs For The Current Tool Loading Model

## Status

in-progress

Rescoped 2026-07-29: the README half of this item is delivered (loading-model
table, project/global sync split, plugin marketplace docs, "all commands and
skills sync by default"). What remains is the FEATURES.md half plus two small
README gaps, listed below.

## Ticket

AIW-108

## Priority

medium

## Summary

Bring `FEATURES.md` back in sync with the repo inventory and the current
project model, and close two small README gaps, so README and FEATURES
describe the same architecture.

## User Story

As a maintainer of `ai-workflows`, I want the docs to match the current
architecture, so that future changes are easier to reason about and
synced-project behavior is clear to contributors.

## Acceptance Criteria

- [ ] The FEATURES.md skills table lists every directory under `skills/`
      (currently 12 of 29 are listed; missing rows include
      address-review-comments, backlog, close-sprint, jira-ticket,
      migration-check, npm-maintenance, receiving-code-review, refinement,
      skill-opportunity, sprint-board, sprint-demo, sprint-planning,
      sustainable-review, test-driven-development, upstream-to-unicore,
      watch-mrs, wcag-audit).
- [ ] The FEATURES.md commands table lists every file under `commands/`
      (currently 9 of 15; missing backlog, close-sprint, refinement,
      sprint-demo, sprint-planning, sustainable-review).
- [ ] The FEATURES.md rules table includes `rules/sonarqube.md` and
      `rules/sustainability.md`, and `rules/rules.md` indexes
      `sonarqube.md`.
- [ ] FEATURES.md describes the project model: `AI-WORKFLOWS.md`,
      `CONVENTIONS.md`, thin adapters, prompt generation, and the slim
      global Claude sync (today it only covers the plugin/matrix part).
- [ ] The README "Repository Structure" section includes `.claude-plugin/`,
      `docs/workflow-canonical-sources.md`, and `scripts/validate-skills.mjs`.
- [ ] The README description of `validate-ai-instructions.sh` reflects
      everything it runs (skill validation, adapter regeneration,
      project-sync smoke test, drift checks), not only "regenerates adapters
      and checks for drift".
- [ ] The docs remain concise and do not duplicate large chunks of template
      content.

## Technical Notes

Verified 2026-07-29 against `main`: README is current on the loading model,
sync split, and plugin marketplace; FEATURES.md is the stale half. Consider
whether the FEATURES inventories should be generated (or at least validated)
by `scripts/validate-skills.mjs` the same way `docs/workflow-canonical-sources.md`
is, so this class of drift cannot recur — but treat that as optional scope.

Review at least:

- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md)
- [rules/rules.md](/Users/wietekepots/Web/ai-workflows/rules/rules.md)

## Out of Scope

- Writing end-user manuals for each external tool
- Reorganizing the entire repository structure
- Changing sync logic solely for documentation convenience

## Related

- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md)
- [rules/rules.md](/Users/wietekepots/Web/ai-workflows/rules/rules.md)
