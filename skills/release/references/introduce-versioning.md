# Introduce versioning

Read this when a project releases without versions and `CONVENTIONS.md`
records no decision about it. The skill proposes the introduction once. The
answer is recorded either way, so the next release does not ask again.

## When versions pay off

Recommend them when the project releases in **batches**: work collects on an
integration or acceptance branch and goes to production together, and the
customer hears about the release. Then a version number earns its keep:

- **Communication.** "Version 1.5.0 is live" means the same thing to the
  customer, the product owner and support. A date or a commit does not.
- **Tracing.** "Since which release is this broken?" becomes one diff
  between two tags.
- **Rollback.** The previous production state has a name.
- **One anchor.** Changelog section, release notes, GitLab Release and
  tracker version all carry the same name.

Advise against them, and record "no versions", when **every merge goes to
production on its own** (continuous deployment). The MR and its deploy are
then the unit, and a version per merge is noise.

## Which scheme

Semver tags `vMAJOR.MINOR.PATCH`, with the pragmatic mapping for a website
that has no API consumers:

| Bump | When |
| --- | --- |
| patch | a hotfix straight to production |
| minor | a regular release: features and/or bundled fixes |
| major | users or editors must work differently: a redesign, a data-model break |

Calendar versions (`2026.10.1`) avoid the minor-or-major debate and are a
valid choice. Keep semver when other projects of the same team already use
it: one convention across projects outweighs the theoretical gain.

## The setup MR

One small, docs-and-config MR through `skills/create-pr`, merged into the
integration branch before the next release:

- `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
  format, with an empty `## [Unreleased]` and a one-paragraph header: every
  MR that changes something user-visible or operational adds its line there;
  repo-internal changes (docs, CI, tooling) get none.
- A versioning section in `docs/release-process.md`, created when the
  runbook lives elsewhere: the bump table above, `package.json` `version`
  equal to the newest tag, tags annotated and only on the production
  branch, one GitLab Release per tag with the changelog section as notes.
- The cut step in the runbook: `npm version X.Y.Z --no-git-tag-version`,
  rename `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD`, commit
  `chore(release): vX.Y.Z`. And the tag step after the promotion.
- A changelog checkbox in the MR template, when the project has one.
- The decision line in `CONVENTIONS.md` (below).

## Baseline tag

The current production commit gets the first tag, so the first versioned
release has something to diff against. Use the `version` already in
`package.json` when it means something, otherwise `v1.0.0`:

```bash
git fetch origin
git tag -a v1.0.0 origin/<production-branch> -m "v1.0.0 (baseline)"
git push origin v1.0.0
```

Protect `v*` tags in GitLab (Settings → Repository → Protected tags) when
the project's maintainers agree; a maintainer has to do that.

## Tracker versions

A separate choice from git versions. Jira fixVersions give the product owner
a release view with date and status, but creating them needs project-admin
rights. Without those rights the label `vX.Y.Z` is the fallback. It has no
date or status, so it is a stopgap. When the team adopts tracker versions,
ask a project admin to give the developers the right to manage versions.

## Record the decision

One line in `CONVENTIONS.md`, under the release or workflow section:

```markdown
- Versioning: semver tags `v*` on `main`, CHANGELOG.md, runbook docs/release-process.md (since 2026-10-07)
- Versioning: none, by choice — every merge to `main` deploys (2026-10-07)
```

"Not now" records nothing, so the next release asks again.
