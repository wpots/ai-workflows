---
name: code-review
description: Review current branch changes against remote base branch — or a GitLab MR / GitHub PR by URL — and produce a structured, severity-ordered review with file references and actionable fixes. Can post findings as inline MR comments autonomously once the user gives a go.
---

# Code Review Skill

Use this skill when the user requests review of current changes, or pastes a
merge request / pull request URL to review.

This skill is the canonical workflow source for code review on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.
The current design decision is to keep one general review workflow and extend it
with an explicit type-safety audit instead of creating a separate type-safety
review skill.

## Base Branch Resolution

Use the first existing branch in this order:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exists, ask the user which base branch to use.

## Workflow

1. Compare current branch against resolved base branch.
2. Prioritize findings by severity:
- Functional bugs/regressions
- Security risks
- Performance issues
- Accessibility and maintainability gaps
- Type-safety risks and missing guardrails
3. When the diff includes TypeScript or boundary-heavy code, use
   `rules/type-safety.md` as the checklist source.
4. Always check for:
- unsafe `as` assertions
- `any` or certainty-erasing coercion
- unchecked parsing (`JSON.parse`, `response.json()`, env vars, database rows,
  files, queue/webhook payloads, third-party SDK data)
- missing boundary validation
- transport-to-domain leakage
- unsafe indexing or property access on uncertain values
- non-exhaustive unions or switches
- missing guardrails that should have caught the issue earlier (`tsconfig`,
  lint, CI, architecture rules)
5. If the diff touches route/page/layout files, page-level templates, modules,
   or components (per the detected stack rule, e.g. `src/app/**/page.tsx`,
   `src/app/**/layout.tsx`, `src/templates/**`, `src/modules/**`,
   `src/components/**` for Next.js), run the **Definition of Done** checklist
   from the stack rule (e.g. `rules/stacks/nextjs-payload.md`) over the changed
   files and report violations as findings instead of only flagging generic
   guardrail gaps:
   - page = route control flow + `<Template/>` only (no markup, fetch, or
     view-model derivation)
   - fetch + view-model derivation in `templates/<Name>/load<Name>.ts`; pure
     raw → props mapping in `Transform*.ts`
   - paths via the project's central route helper (no hand-written,
     locale-prefixed URL strings)
   - component prop interfaces in `types.ts`, never inline in the `.tsx`
   - one transform per module; hooks hold client state only
   If a violation is pre-existing neighbour code the diff didn't introduce,
   note it as a suggested follow-up rather than a blocking finding (see
   "Conform to the rule, not the neighbour" in `rules/clean-architecture.md`).
6. Provide concrete file references with line numbers.
7. For each finding, explain:
- why the code is unsafe
- the trust boundary or failure mode
- severity
- the best guardrail type: code change, lint rule, `tsconfig` rule, CI check, or architecture rule
8. Include targeted fixes or examples for high-impact findings.
9. If requested, write report to `./.docs/CODE_REVIEW.md`.

## Output Format

Keep findings first and severity-ordered, then use these fixed sections:

1. `Findings`
2. `Type-Safety Risks`
3. `Boundary Validation Gaps`
4. `Unsafe Assertions`
5. `Workflow Guardrails`
6. `Concrete Fixes`

If a section has no issues, say `None found.` If no type-safety issues are
found, explain briefly why the code appears safe, for example validated
boundaries, no unsafe assertions, and exhaustive handling of variants.

## Remote MR Review (GitLab)

When the input is a GitLab MR URL, do all of this without asking for
permission between steps — the URL itself is the go-ahead to fetch and review:

1. Parse the project path and MR IID from the URL
   (`gitlab.com/<group>/<subgroups...>/<project>/-/merge_requests/<iid>`).
2. Fetch context in one pass:
   - `glab mr view <iid> --repo <project-path>` — title, description, state
   - `glab mr diff <iid> --repo <project-path>` — save to a scratch file when
     large; read it fully before judging
   - `glab api "projects/<url-encoded-path>/merge_requests/<iid>/notes?sort=asc"`
     — existing human comments (skip bots and system notes)
3. Review with the same severity ordering and checklists as a local review.
   If the repo exists locally, use it for context on files the diff touches
   but does not show; otherwise review from the diff alone and say so.
4. Deliver the review in chat: verdict first, findings severity-ordered, each
   anchored to `file:line`. Do NOT post anything to GitLab yet — end by
   offering to post the findings as MR comments.

## Posting Review Comments to GitLab

One go from the user ("post them", "create comments for point 2 and 3") covers
the whole batch: post every requested comment, verify, and report once at the
end. Do not ask per comment, and do not re-ask when a retry or repost is
needed to fix a technical failure — that is part of the same go.

Mechanics (hard-won; do not deviate):

- Get `diff_refs` (`base_sha`, `start_sha`, `head_sha`) from
  `glab api "projects/<path>/merge_requests/<iid>"` first.
- Post inline comments to `.../merge_requests/<iid>/discussions` with a
  **nested JSON body** via stdin:
  `glab api <path> -X POST --input - -H "Content-Type: application/json"`
  and payload `{"body": ..., "position": {"position_type": "text",
  base_sha, start_sha, head_sha, "old_path", "new_path", "new_line"}}`.
  NEVER use `-f "position[...]=..."` — glab sends those as flat JSON keys,
  GitLab silently ignores the position, and you get an unanchored
  `DiscussionNote` instead of a `DiffNote`.
- Compute `new_line` from the diff hunk headers (`@@ -a,b +c,d @@`): count
  context + added lines from `c`. For added lines send `new_line` (keep
  `old_path` equal to `new_path` for modified files); for removed lines send
  `old_line` instead.
- Write comment bodies in a Python script or JSON file — never inline in
  shell. Bodies with backticks, `${...}`, or regexes get mangled by shell
  escaping.
- GitLab suggestion blocks (```` ```suggestion:-0+0 ````) are welcome for
  small, concrete fixes.
- **Verify after posting**: fetch the discussions back and check each note has
  `"type": "DiffNote"` and a non-null `position`. If a note came back as
  `DiscussionNote`, delete it (`DELETE .../notes/<id>`) and repost correctly
  — silently, as part of the same batch.
- Report once at the end: which comments were posted and where.

## Constraints

- Focus on substantive issues; skip style-only nitpicks.
- Do not edit code unless explicitly requested.
- Never post to the MR before the user asks; after they ask, never stop
  halfway to ask again.
