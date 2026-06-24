# Chore: Refresh Docs For The Current Tool Loading Model

## Status

draft

## Ticket

AIW-108

## Priority

medium

## Summary

Refresh the repo documentation so the current tool-loading model, generated artifacts, and adapter responsibilities are described consistently across the main docs.

## User Story

As a maintainer of `ai-workflows`, I want the docs to match the current architecture, so that future changes are easier to reason about and synced-project behavior is clear to contributors.

## Acceptance Criteria

- [ ] [README.md](/Users/wietekepots/Web/ai-workflows/README.md) and [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md) describe the same current project model.
- [ ] The docs explain the role of `AI-WORKFLOWS.md`, `CONVENTIONS.md`, thin adapters, prompt generation, and the slim global Claude sync.
- [ ] The inventory of generated versus canonical source files is unambiguous.
- [ ] References to outdated assumptions are removed or explicitly reframed.
- [ ] The documentation reflects the current sync behavior for experimental commands and skills.
- [ ] The docs remain concise and do not duplicate large chunks of template content.

## Technical Notes

The repo already moved in the right direction, but the documentation is still partially split between older and newer mental models.

Review at least:

- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md)
- [rules/rules.md](/Users/wietekepots/Web/ai-workflows/rules/rules.md)

This item should follow the generator/validator alignment work, because the docs need to describe the chosen final behavior.

## Out of Scope

- Writing end-user manuals for each external tool
- Reorganizing the entire repository structure
- Changing sync logic solely for documentation convenience

## Related

- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md)
- [rules/rules.md](/Users/wietekepots/Web/ai-workflows/rules/rules.md)
