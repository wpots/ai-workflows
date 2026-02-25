---
name: pr-description
description: Generate a concise, structured PR description from branch diff against best available base branch, including change categories and testing notes.
---

# PR Description Skill

Use this skill when the user asks to draft PR text.

## Base Branch Resolution

Use the first existing branch in this order:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exists, ask the user which base branch to use.

## Output Structure

- Title (50-72 chars)
- Summary (2-3 sentences)
- Breaking Changes (if any)
- Key Modifications by category (Features, Bug Fixes, Refactoring, Chore)
- Testing Notes
- Optional Technical Notes

## Guidelines

- Keep output concise and review-friendly.
- Prefer counts and impact summaries over long file lists.
- Do not run push/PR creation commands.
