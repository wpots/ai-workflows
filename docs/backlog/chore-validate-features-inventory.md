# Chore: Validate the FEATURES.md Inventories

## Status

done

## Priority

medium

## Summary

`FEATURES.md` was the only repo inventory the validator did not check, and it
drifted exactly as predicted — before the AIW-108 refresh it listed 12 of 29
skills; after the refresh it was still missing the `react-aria` MCP server.
`docs/workflow-canonical-sources.md` and `docs/pipeline-map.md` stay correct
because `scripts/validate-skills.mjs` checks them. Give `FEATURES.md` the same
protection so the AIW-108 refresh is the last manual catch-up it ever needs.

## User Story

As a maintainer of ai-workflows, I want FEATURES.md checked by the validator,
so that the feature reference stays trustworthy without periodic manual
audits.

## Acceptance Criteria

- [x] `scripts/validate-skills.mjs` errors when `FEATURES.md` names a repo
      path that is not tracked (same rule as the canonical-sources check).
- [x] It warns when a tracked skill, command, or rule is missing from the
      matching FEATURES.md table.
- [x] It warns when a server defined in `mcp/servers.json` is missing from
      the MCP table.
- [x] The one remaining drift is fixed: the `react-aria` server is listed in
      the MCP table.
- [x] The maintainer note in `README.md` ("Add or update a skill") mentions
      the FEATURES.md inventory row.

## Technical Notes

- The block sits between the canonical-sources and pipeline-map checks in
  `scripts/validate-skills.mjs` and reuses the same `tracked`/`err`/`warn`
  helpers and the placeholder guard (`[<>*]`).
- Coverage checks are warnings, path checks are errors — matching the house
  style of the neighboring blocks.
- The skills table lists bare names (`` `commit-message` ``) while the
  commands and rules tables list full paths; the checks match each table's
  actual convention.

## Out of Scope

- Restructuring FEATURES.md or merging it into other inventories.
- Validating the packages or tool-support tables beyond path existence.

## Related

- [../../FEATURES.md](../../FEATURES.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- [chore-refresh-docs-for-tool-loading-model.md](chore-refresh-docs-for-tool-loading-model.md)
