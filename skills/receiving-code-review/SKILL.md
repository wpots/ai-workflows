---
name: receiving-code-review
description: Evaluate incoming code-review feedback with technical rigor before implementing any of it — restate, verify against the codebase, push back with reasoning when a suggestion is wrong, and only then apply. Use when responding to reviewer comments on a PR/MR, when feedback seems unclear or technically questionable, or before acting on review suggestions. Complements address-review-comments, which handles the apply-and-push mechanics.
---

# Receiving Code Review

Code review is technical evaluation, not emotional performance. **Core principle:**
verify before implementing, ask before assuming, technical correctness over social
comfort.

This skill owns the *evaluation* step — deciding whether each comment is right for
this codebase. Once you've decided what to act on, `address-review-comments` owns the
mechanics (isolated worktree, apply per comment, run checks, push, rebase).

## Response pattern

For every piece of feedback:

1. **Read** the whole set without reacting.
2. **Understand** — restate each item in your own words, or ask.
3. **Verify** against codebase reality (grep for usage, read the surrounding code).
4. **Evaluate** — is it technically sound for *this* codebase and stack?
5. **Respond** — technical acknowledgment, or reasoned pushback.
6. **Implement** — one item at a time, checks green after each (hand off to
   `address-review-comments`).

## No performative agreement

Skip the filler. It adds nothing and signals you acted before verifying.

- ❌ "You're absolutely right!" / "Great point!" / "Thanks for catching that!"
- ❌ "Let me implement that now" (before verifying)
- ✅ Restate the technical requirement, ask a specific question, or just fix it and
  show the change.

When feedback is correct: `"Fixed — <what changed> in <location>."` No gratitude
expressions. The code shows you heard it. If you catch yourself typing "Thanks",
delete it and state the fix.

## Unclear feedback — clarify all of it first

If any item is unclear, STOP. Do not implement the clear ones yet — items are often
related, and partial understanding produces the wrong implementation.

> Reviewer: "Fix 1-6." You understand 1, 2, 3, 6, unclear on 4, 5.
> ✅ "I understand 1, 2, 3, 6. Need clarification on 4 and 5 before proceeding."

## Source-specific handling

**From the user / a trusted teammate:** implement after understanding; still ask if
scope is unclear; skip performative agreement.

**From external reviewers (or an automated reviewer / bot):** be skeptical, check
carefully. Before implementing, confirm:

1. Technically correct for *this* codebase and stack?
2. Does it break existing functionality?
3. Is there a reason the current implementation is the way it is?
4. Does it hold across the versions/browsers/platforms we support?
5. Does the reviewer have the full context?

If a suggestion seems wrong → push back with technical reasoning. If you can't verify
→ say so: "I can't verify this without <X>. Investigate, ask, or proceed?" If it
conflicts with a decision the user already made → stop and discuss first.

## YAGNI check on "do it properly" suggestions

When a reviewer says "implement this properly" (metrics, filters, export, config),
grep for actual usage first.

- Unused: "Nothing calls this. Remove it (YAGNI)? Or is there usage I'm missing?"
- Used: then implement properly.

## When to push back

Push back when the suggestion breaks existing behavior, the reviewer lacks context,
it violates YAGNI, it's wrong for this stack, legacy/compat reasons exist, or it
conflicts with an agreed architectural decision.

**How:** technical reasoning, not defensiveness. Ask specific questions, reference
working tests/code, involve the user if it's architectural. If you were wrong after
pushing back: `"You were right — checked <X>, it does <Y>. Implementing now."` State
the correction, no long apology, no defending why you pushed back.

## Implementation order

Clarify everything unclear first. Then: blocking issues (breaks, security) → simple
fixes (typos, imports) → complex fixes (refactor, logic). Verify checks after each;
never batch without testing.

## Replying in the thread

Reply in the review thread, not as a top-level comment:

- **GitHub:** `gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`
- **GitLab:** reply on the discussion via `glab` / the MR discussions API, keeping the
  reply attached to the originating discussion thread.

## Common mistakes

| Mistake | Fix |
|---|---|
| Performative agreement | State the requirement or just act |
| Blind implementation | Verify against the codebase first |
| Batch without testing | One at a time, checks green after each |
| Assuming the reviewer is right | Check whether it breaks things |
| Avoiding pushback | Technical correctness beats comfort |
| Partial implementation | Clarify all items first |
| Can't verify, proceed anyway | State the limitation, ask for direction |

## Bottom line

External feedback = suggestions to evaluate, not orders to follow. Verify, question,
then implement. Technical rigor always.
