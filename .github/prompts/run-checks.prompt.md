---
name: run-checks
description: "Run All Checks"
---

# Run All Checks

Run project quality checks in sequence with review prompts between failures.

## Checks to Run (in order)

1. **lint** - `npm run lint`
2. **type-check** - `npm run type-check`
3. **stylelint** - `npm run stylelint`
4. **test** - `npm run test`
5. **build** - `npm run build`

## Rules

1. **Check package.json first** - Only run checks if the script exists in package.json
2. **Sequential execution** - Run checks one at a time in the order listed above
3. **No automatic code edits** - Do NOT run fix variants unless explicitly asked (for example `lint:fix`)
4. **Failure handling**:
   - If a check fails, display the error output
   - List what failed clearly
   - **STOP and prompt the user** before continuing to the next check
   - Ask: "Check failed. Would you like to: [fix it / skip to next check / abort]?"
5. **Success handling** - If a check passes, automatically continue to the next one
6. **Summary** - At the end, provide a summary of all checks run and their results

## Important

- Do NOT modify any code unless explicitly asked
- Run scripts exactly as defined in package.json
- Present failures clearly and wait for user decision
- Skip checks that don't have scripts in package.json (mention this)

## Note

Even if all checks pass, commits/pushes may still fail due to:

- Git hooks (pre-commit, commit-msg, pre-push)
- Protected branch rules or CI/CD checks
- Formatting requirements (Prettier, etc.)
- Server-side validations
