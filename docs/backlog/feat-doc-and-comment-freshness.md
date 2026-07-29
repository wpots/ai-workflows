# Feature: Documentation and Comment Freshness

## Status

ready

Readiness pass 2026-07-29: verified against the repo — nothing delivered yet,
ACs are concrete and self-contained. Two delivery requirements not in the ACs:
register `rules/documentation.md` in `docs/pipeline-map.md`
(`validate-skills.mjs` warns on unplaced rules), and follow the plugin release
rule if it has landed (changes to `skills/` or `commands/` need a
`.claude-plugin/plugin.json` bump plus a matching `CHANGELOG.md` entry).

## Priority

medium

## Summary

Make stale comments and docs a reviewable defect: one rule stating that documentation
describing changed code is updated in the same MR, and one review dimension in
`skills/code-review` that actually checks it. Outdated comments mislead the next
reader — and the next agent, which reads them as fact.

## User Story

As the next person (or agent) to touch this code, I want comments, JSDoc, and docs to
describe what the code does now, so that I do not build on a description that stopped
being true two merge requests ago.

## Acceptance Criteria

- [ ] New `rules/documentation.md` stating: comments, JSDoc, and repo docs that
      describe changed behaviour are updated in the **same** MR; a comment that
      contradicts the code is a defect, not a nitpick; delete a comment rather than
      leave it wrong; the doc language follows the repo, not the chat.
- [ ] `rules/rules.md` lists the new file with a "when to load" line.
- [ ] `skills/code-review` gains a "documentation and comment freshness" dimension
      covering: comments contradicting the changed code, JSDoc on changed signatures,
      and repo docs (`README`, `CONVENTIONS.md`, `AI-WORKFLOWS.md`, `docs/*`) that
      describe the changed behaviour.
- [ ] Findings are severity-ordered like the rest of the review, with a file
      reference and the concrete stale sentence — not a generic "check your docs".
- [ ] The dimension is scoped to the diff: it does not become a repo-wide doc audit
      (`skills/maintenance` owns the periodic sweep).
- [ ] `commands/review-code.md` stays aligned as the fallback surface.
- [ ] The new rule ships to projects through the normal sync path.

## Technical Notes

`skills/code-review` currently has no ticket, doc, or comment checks at all — this is
a new dimension, not a tightening of an existing one.

Keep the split the repo already uses: policy in `rules/`, execution in the skill. The
review cites the rule; the rule does not describe review mechanics.

The cheap, high-value signal is a comment whose subject appears in the diff: a renamed
function still named in a comment, a changed default still documented as the old
value, a removed branch still explained. Prefer that over asking the model to judge
"is this comment good".

## Out of Scope

- A separate doc-freshness skill (the review already reads the diff).
- Repo-wide documentation audits.
- Enforcing comment density or style.

## Related

- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- [../../commands/review-code.md](../../commands/review-code.md)
- [../../rules/rules.md](../../rules/rules.md)
- [../pipeline-map.md](../pipeline-map.md)
