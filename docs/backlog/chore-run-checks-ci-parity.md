# Chore: run-checks CI Parity

## Status

draft

## Priority

medium

## Summary

Derive the local check sweep from the project's CI configuration instead of from
convention, so "green locally" means "green in CI". This is the prevention half of
pipeline triage: most repeat CI failures are commands CI runs that the local sweep
never ran.

## User Story

As a developer running the checks before pushing, I want the sweep to be the same set
of commands CI will run, so that a passing local run is a real signal instead of a
partial one.

## Acceptance Criteria

- [ ] `skills/run-checks` reads the project's CI configuration (`.gitlab-ci.yml`,
      `.github/workflows/*.yml`) and derives the command list from the jobs that gate
      the merge, instead of assuming a fixed lint/type/test/build sequence.
- [ ] Commands that exist in CI but have no local equivalent are reported explicitly
      as "cannot verify locally" rather than skipped silently.
- [ ] Commands that exist locally but not in CI still run, and are labelled as extra.
- [ ] Falls back to the current convention-based sequence when no CI configuration is
      found, and says so.
- [ ] The existing sustainability guidance holds: the full parity sweep runs once
      before pushing; targeted scopes are used while building.
- [ ] The skill reports a short parity summary — which CI jobs were covered, which
      were not, and why.
- [ ] `commands/run-checks.md` stays aligned as the fallback surface.

## Technical Notes

`skills/create-pr` already insists on reading the actual hook files
(`.husky/pre-push`, `.husky/pre-commit`) and running every command they list
verbatim, rather than assuming the hook only runs lint/type/test. This item extends
exactly that reasoning from git hooks to CI jobs — same failure mode, one level out.

Parsing CI YAML fully is out of proportion. Extracting `script:` lines from jobs in
the validating stage(s) is enough; when the shape is unclear, ask instead of guessing.

Monorepos and matrix jobs will not map one-to-one. Report the mismatch instead of
inventing a mapping.

## Out of Scope

- Running CI containers locally (act, gitlab-runner exec).
- Changing CI configuration.
- Caching or incremental-check infrastructure.

## Related

- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../../commands/run-checks.md](../../commands/run-checks.md)
- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md)
- [feat-pipeline-triage.md](feat-pipeline-triage.md)
