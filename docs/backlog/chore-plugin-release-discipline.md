# Chore: Plugin Release Discipline (Version + Changelog + Validator)

## Status

done

## Priority

high

## Summary

The `greenberry` plugin ships from `main` with no `version` in
`.claude-plugin/plugin.json`, so every merged MR is a silent, unversioned
release: consumers cannot see what changed or correlate a behavior change
with a merge. Add plain-semver versioning, a changelog, and a validator check
that keeps the two in sync.

## User Story

As a developer consuming the greenberry plugin, I want plugin releases to be
versioned and documented, so that I can tell what changed when Claude Code
pulls a plugin update.

## Acceptance Criteria

- [x] `.claude-plugin/plugin.json` has a semver `version` field (first
      release: `1.0.0`).
- [x] `CHANGELOG.md` exists at the repo root (Keep a Changelog format) with an
      entry for the current manifest version.
- [x] `scripts/validate-skills.mjs` errors when the manifest is missing a
      version, the version is not plain semver, `CHANGELOG.md` is missing, or
      the current version has no changelog entry — so pre-commit and CI catch
      a missed bump.
- [x] The bump rule (MAJOR/MINOR/PATCH, what counts as a release) is
      documented in `README.md` under Maintainer Notes.
- [x] `shared/upstream-mr.md` mentions the bump so upstream MRs from projects
      follow the same discipline (adapters regenerated).

## Technical Notes

- The plugin manifest is `.claude-plugin/plugin.json`; the marketplace
  manifest (`.claude-plugin/marketplace.json`) needs no version — Claude Code
  versions installs per plugin, not per marketplace.
- The validator sees the tree, not diffs, so it checks version–changelog
  *consistency*, not whether a given MR should have bumped. The bump habit
  lives in the README rule and the upstream-mr fragment.
- Whether `commands/` should remain in the plugin at all (they surface as
  `/greenberry:<command>` next to the skills) is a separate open decision
  from the July 2026 AI stack review; this item deliberately leaves plugin
  contents unchanged.

## Out of Scope

- Removing or scoping `commands/` out of the plugin (separate decision).
- Release automation that bumps the version.
- Release channels or plugin signing.

## Related

- [../../.claude-plugin/plugin.json](../../.claude-plugin/plugin.json)
- [../../CHANGELOG.md](../../CHANGELOG.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
