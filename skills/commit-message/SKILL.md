---
name: commit-message
description: Generate a conventional commit message from staged or unstaged diff. Use when the user asks to write a commit message, generate a commit, or format git commit text.
---

# Commit Message Skill

Use this skill when the user asks to write or generate a commit message.

## Workflow

1. Run `git diff --cached` to get staged changes.
2. If empty, run `git diff HEAD` and note it covers unstaged changes.
3. If both are empty, stop — nothing to commit.
4. Analyze the diff and generate a Conventional Commits message.

## Format

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
- `style` — formatting only, no logic change
- `perf` — performance improvement
- `ci` — CI/CD changes
- `revert` — reverts a previous commit

### Rules

- Subject: 50 chars max, imperative mood, no trailing period
- Scope: optional, lowercase, single word or hyphenated
- Body: wrap at 72 chars; explain _why_, not _what_
- Breaking change: use `BREAKING CHANGE:` footer or `!` suffix
- Issue refs in footer: `Closes #123`

## Constraints

- Output the message in a code block, ready to copy.
- Flag diffuse diffs (multiple unrelated changes) and suggest splitting.
- Do NOT run `git commit` unless explicitly asked.
