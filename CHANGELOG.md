# Changelog

Release notes for the `greenberry` plugin — everything the plugin ships from
this repo: `skills/`, `commands/`, and the `.claude-plugin/` manifests.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
plain semver. Bump `version` in `.claude-plugin/plugin.json` and add the entry
here **in the same MR** whenever a change alters what the plugin ships. See
"Ship a plugin release" in `README.md` for the bump rule. Docs-only changes
don't bump.

## [Unreleased]

## [1.0.0] - 2026-07-29

### Added

- First versioned release. The plugin has shipped from `main` since
  2026-07-28 (all skills, command runbooks, and the marketplace manifest);
  this release adds the `version` field, this changelog, and a validator
  check (`scripts/validate-skills.mjs`) that fails when the manifest version
  has no matching changelog entry.
