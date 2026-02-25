# Commit Message Generator

Generate a conventional commit message from the current staged diff.

## Inputs

- Run `git diff --cached` to get the staged changes.
- If nothing is staged, run `git diff HEAD` and note it covers unstaged changes.
- If neither has output, stop and tell the user there is nothing to commit.

## Format

Follow the Conventional Commits spec:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

- `feat` — new feature
- `fix` — bug fix
- `refactor` — code change that neither adds a feature nor fixes a bug
- `chore` — build, tooling, dependency updates
- `docs` — documentation only
- `test` — adding or fixing tests
- `style` — formatting, missing semicolons, etc. (no logic change)
- `perf` — performance improvement
- `ci` — CI/CD config changes
- `revert` — reverts a previous commit

### Rules

- Subject line: 50 characters max, imperative mood ("add" not "added"), no period at end
- Scope: optional, lowercase, single word or hyphenated (e.g. `Button`, `auth`, `api`)
- Body: wrap at 72 characters; explain the _why_, not the _what_
- Breaking change: add `BREAKING CHANGE:` footer or `!` after type/scope
- Reference issues in footer: `Closes #123`, `Fixes #456`

## Output

Provide the commit message in a code block, ready to copy.

If the diff contains multiple unrelated changes, flag it and suggest splitting into separate commits.

**Important:** Do NOT run `git commit` unless explicitly asked.
