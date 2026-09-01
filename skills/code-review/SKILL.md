---
name: code-review
description: Review current branch changes against remote base branch — or a GitLab MR / GitHub PR by URL — and produce a structured, severity-ordered review with file references and actionable fixes. Can post findings as inline MR comments autonomously once the user gives a go. Use when the user asks to review current changes, a pull request, or a merge request.
---

# Code Review

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
2. Sweep every review lens deliberately — one pass per lens, so no lens is
   silently skipped on a large diff:
   - **Correctness** — functional bugs, regressions, broken edge cases
   - **Security** — injection, authn/authz gaps, secret handling, unsafe
     redirects/uploads
   - **Performance & sustainability** — N+1 queries, caching, bundle and
     client-JS weight (`rules/sustainability.md` when public routes change)
   - **Accessibility** — semantics, keyboard, focus
     (`rules/accessibility.md` for interactive UI)
   - **Architecture** — layer boundaries, dependency direction
     (`rules/clean-architecture.md` plus the detected stack rule)
   - **Type safety** — the audit in step 4
   - **Documentation & comment freshness** — the checks in step 6
   - **Test coverage** — changed behaviour without a changed or added test
     (`rules/testing.md`)

   Merge everything into ONE severity-ordered findings list: the lens label
   stays on each finding (`[security]`, `[a11y]`, …), severity decides the
   order. For large diffs (roughly >15 files or >800 changed lines), run the
   lenses as parallel subagents — one lens per agent, each reading only the
   diff plus its rule file — and merge their outputs; a finding survives the
   merge only with a concrete `file:line` anchor.
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
   - new files under `utils/`, `lib/`, or `constants/` have a second consumer
     outside the owning feature — a single-consumer helper (and its test)
     belongs in the feature's module folder, and a feature-named subfolder
     under a shared layer (`utils/<feature>/`) is the tell ("Shared Layers
     Are Earned, Not Claimed" in `rules/project.md`)
   If a violation is pre-existing neighbour code the diff didn't introduce,
   note it as a suggested follow-up rather than a blocking finding (see
   "Conform to the rule, not the neighbour" in `rules/clean-architecture.md`).
6. Check documentation and comment freshness, scoped to the diff (policy:
   `rules/documentation.md`; repo-wide audits belong to `skills/maintenance`):
   - comments whose subject appears in the diff but now contradict the changed
     code (renamed/removed function still named, changed default still
     documented as the old value, removed branch still explained)
   - JSDoc on changed signatures (parameters, return type, thrown errors)
   - repo docs (`README`, `CONVENTIONS.md`, `AI-WORKFLOWS.md`, `docs/*`) that
     describe the changed behaviour
   - comments the diff **adds** that restate the adjacent code, argue why the
     change is correct ("shared on purpose", "deliberately", "is the point"),
     essay-length file headers duplicating the MR description, comments that
     out-density their siblings on the same kind of construct, or references
     to something that will not exist (an MR or PR number, "see the MR") —
     per "What A New Comment May Say" in `rules/documentation.md`; recommend
     deletion and moving any justification into the MR description
   - the **same fact in more than one file** — a measurement, a spike
     finding, a dependency's version-specific behaviour. Grep a distinctive
     phrase from each new explanatory block across the diff: two or more hits
     is one finding, naming the single home the fact belongs in (per "One
     Home Per Fact"). A stated number that no test asserts belongs in the
     same finding.
   - **docblock placement** — a docblock above a props/options interface that
     describes the component, and a file overview placed below the imports.
     Both read correctly in the diff and document nothing on hover, so they
     are only found by looking (per "JSDoc Attaches To A Declaration").
   A comment that contradicts the code is a defect: report it with the file
   reference and the concrete stale sentence, and recommend updating it in
   this MR — or deleting it when it cannot be made true cheaply. Do not report
   comment volume or a comment-to-code ratio as a finding.
7. Provide concrete file references with line numbers.
8. For each finding, explain:
- why the code is unsafe
- the trust boundary or failure mode
- severity
- the best guardrail type: code change, lint rule, `tsconfig` rule, CI check, or architecture rule
9. Include targeted fixes or examples for high-impact findings.
10. If requested, write report to `./.docs/CODE_REVIEW.md`.

## Output Format

Keep findings first and severity-ordered, each tagged with its lens
(`[correctness]`, `[security]`, `[perf]`, `[a11y]`, `[architecture]`,
`[type-safety]`, `[docs]`, `[tests]`), then use these fixed sections:

1. `Findings`
2. `Type-Safety Risks`
3. `Boundary Validation Gaps`
4. `Unsafe Assertions`
5. `Documentation & Comment Freshness`
6. `Workflow Guardrails`
7. `Concrete Fixes`

If a section has no issues, say `None found.` If no type-safety issues are
found, explain briefly why the code appears safe, for example validated
boundaries, no unsafe assertions, and exhaustive handling of variants.
Documentation findings quote the concrete stale sentence with its file
reference — never a generic "check your docs".

When the diff adds or grows a workflow asset (see the next section), append an
eighth section: `Value & Maturity`.

## Reviewing Workflow-Asset MRs (skills, commands, rules)

When the diff adds or grows a skill, command, rule, or hook — in this repo, in
`unicore-template`, or in a project's `.claude/` — correctness review alone is
not enough: prose that instructs agents is product code, and every skill
description loads into every session of every synced project. Add a
**Value & Maturity** section to the review output, answering each question
explicitly:

1. **Frequency × cost** — how often does the failure it addresses occur, and
   what does one occurrence cost? Rare-but-catastrophic earns its place; a
   one-off inconvenience does not.
2. **Platform overlap** — does the harness already solve this (auto-compact,
   session resume, worktree isolation, hooks)? Codifying a workaround for a
   platform feature is a maturity smell. Verify against current tool
   behaviour, not memory.
3. **Prevention or recovery** — prefer the change that stops the failure over
   the one that cleans up after it. A recovery-only addition says why
   prevention is not possible.
4. **Ambient-context cost** — does the benefit clear the cost of one more
   always-loaded description, or does this belong as a section or reference
   file of an existing skill? Flag overlap with existing skills' trigger
   phrases: overlapping descriptions cause mis-routing and under-triggering.
5. **Measurability** — how will the team know it paid off? An eval case, a
   validator check, or a named metric beats "we'll notice". "Enforced by
   nothing" is acceptable only with a tracked follow-up.
6. **Personal vs team surface** — personal tooling stays in personal skills; a
   shared skill keeps at most a gated one-line hook to it.
7. **Reproducibility** — is a new hard rule a reproduced finding or a single
   observation? Single observations carry their evidence (date, tool version,
   exact error string) so the next contradicting observation is diagnosable
   rather than a coin toss between two hard-won rules.

Ground the judgment in current frontrunner practice (Anthropic skill-authoring
and context-engineering guidance, GitLab/Graphite workflow docs, and peers):
search, do not recall, and cite what you used in the review's sources.

Admission bar for the verdict: a lesson enters a shipped skill only when it
recurs or is catastrophic and cheap to check; everything else is a repo doc or
a backlog item.

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

- Focus on substantive issues; skip style-only nitpicks. Redundant **added**
  comments and single-consumer files in shared layers are substantive, not
  style — they cost a review round-trip every time (steps 5–6).
- Do not edit code unless explicitly requested.
- Never post to the MR before the user asks; after they ask, never stop
  halfway to ask again.
