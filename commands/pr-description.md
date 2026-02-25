# PR Description Generator

Generate a PR description against the best available remote base branch.

## Base Branch Resolution

Resolve in this order and use the first branch that exists:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exist, stop and ask the user which base branch to use.

## Requirements

Analyze the diff and create a structured PR description including:

- **Title**: Concise, descriptive (50-72 chars)
- **Summary**: High-level overview (2-3 sentences)
- **Breaking Changes**: Include migration notes if applicable
- **Key Modifications**:
  - Categorize by type (Features, Bug Fixes, Refactoring, Chore)
  - Focus on significant changes
  - Include file/component counts per category
- **Testing Notes**: Required testing steps or affected areas
- **Technical Notes**: Important implementation details (optional)

## Guidelines

- Keep it concise and scannable
- Use counts, not long file lists
- Highlight user-facing changes and architecture decisions
- Write for developers reviewing the PR

## Output Format

Provide markdown ready to paste into the PR.

**Important:** Generate description only. Do NOT run push or PR creation commands.
