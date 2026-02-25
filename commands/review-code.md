# Code Review

Review my code changes against the best available remote base branch.

## Base Branch Resolution

Resolve in this order and use the first branch that exists:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exist, stop and ask the user which base branch to use.

## Review Scope

Compare all changes between current branch and the resolved base branch and provide:

- **Code Quality**: Potential bugs, code smells, and anti-patterns
- **Best Practices**: Next.js, React, TypeScript, and Tailwind standards
- **Performance Issues**: Re-render risks and inefficient patterns
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- **Type Safety**: Avoid `any`, use narrowing and safe typing
- **Testing Gaps**: Critical paths lacking coverage
- **Security Concerns**: Unsafe patterns or vulnerabilities
- **Suggestions**: Specific, actionable improvements with examples

Focus on substantive issues that affect functionality, maintainability, or user experience. Skip formatting nitpicks.

## Output Format

- Create `./.docs/CODE_REVIEW.md` (create `./.docs` if missing)
- Use clear sections and checkboxes for suggestions
- Include code examples when useful
- Add file references with line numbers where relevant

**Important:** Only review code. Do NOT make edits, commits, or pushes unless explicitly requested.
