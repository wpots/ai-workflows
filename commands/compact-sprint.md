# Compact Sprint Runbook

Canonical runbook for compacting old sprint documentation. The `compact-sprint`
skill on skill-aware tools wraps this runbook; Codex, Copilot, and other
prompt-first tools should follow these steps directly.

Goal: shrink the repo's sprint history without losing information that still
matters. Delivered BLIs mix ephemeral content (status, commit references,
sprint planning, how-to-test) with durable content (product decisions,
data-model choices, out-of-scope boundaries). After a retention window the
ephemeral shell only pollutes search results with stale acceptance criteria and
outdated technical notes. Compacting distills the durable content into flagged
follow-ups, rewrites the sprint changelog to the compact template, and removes
the sprint folder — behind a git tag with a documented retrieval path, so
nothing is lost, only relocated into git history.

## Safety

- **Retention guard:** only a closed sprint is eligible — its changelog is on
  the integration branch's remote, so the close is committed and pushed and
  the running sprint never qualifies. The last-closed sprint also waits for
  the next sprint's planning, which reads its gaps document
  (`commands/sprint-planning.md`): eligible once
  `docs/sprint-<M+1>-planning.md` exists or the user confirms no planning
  follows. Older closed sprints are eligible.
- Count what still leans on the folder before compacting it (Phase 0): every
  link from a living doc becomes a retrieval recipe, so while ADRs,
  architecture docs, a cross-sprint register or open backlog items link in,
  recommend waiting until the work they document has shipped.
- **Never** run `git commit`, `git tag`, or `git push` — prepare everything and
  hand the exact commands to the user (same rule as close-sprint).
- Harvest is **flag-only**: durable content becomes `docs/todo/` items; this
  run never rewrites `docs/specs/`, `CONVENTIONS.md`, or `rules/` itself.
- The issue tracker is not needed and not touched. Acceptance criteria of
  ticketed items are canonical in the tracker, and delivery verification
  already happened at sprint close — this lane never re-verifies it.
- All removals and rewrites land in one reviewable diff.
- A sprint without a changelog cannot be compacted — run close-sprint first.

## Inputs

Ask the user at start:

1. Sprint number(s) to compact (default: every closed sprint that still has a
   `docs/sprint-<M>/` folder and passes the retention guard).
2. When a target is the last-closed sprint (the highest changelog): whether
   the next sprint's planning has run — infer from
   `docs/sprint-<M+1>-planning.md`, and confirm.

## Support mode (projects without sprints)

Support archives compact the same way (see the "Support mode" section of
`commands/close-sprint.md`). Read the sprint artifacts as their support
equivalents: `docs/support-<yyyy>-<mm>/` for `docs/sprint-<M>/`,
`docs/support-<yyyy>-<mm>-changelog.md` for the changelog, tag
`support-<yyyy>-<mm>-bli-archive` as the archive anchor, and
`docs/todo/harvest-support-<yyyy>-<mm>-<topic>.md` for harvest flags. The
retention guard counts calendar months: in month M, only months ≤ M−2 are
eligible — the close of month M still cross-references month M−1.

## Phase 0 — Preconditions

1. Run from an up-to-date integration branch (`development` by default):
   clean working tree, `git fetch` + `git pull --ff-only` — same as
   close-sprint Phase 0.
2. For each target sprint M verify, refusing the sprint when a check fails:
   - the close is pushed:
     `git cat-file -e origin/<integration>:docs/sprint-<M>-changelog.md`;
   - for the last-closed sprint, the next planning has run (Inputs 2);
   - `docs/sprint-<M>/` exists.
3. Count the references to the folder across the whole repository, not only
   `docs/`, and report them per file:

   ```bash
   git grep -c -E "sprint-<M>/" -- . ':!docs/sprint-<M>/' ':!docs/sprint-<M>-changelog.md'
   rg -c "sprint-<M>/" docs/todo/
   ```

   The first command reads tracked files in every directory (docs, source,
   scripts, config); the second adds the gitignored local todos. Phase 2 turns
   each living-doc reference into a retrieval recipe. When ADRs, architecture
   docs, a cross-sprint register or open backlog items are among them,
   recommend waiting until the work they document has shipped, and let the
   user decide. Not a refusal: the count is the user's input. A hit under
   `src/`, `scripts/`, `e2e/` or config is a code reference: Phase 2 and 4
   say what happens to it.

## Phase 1 — Harvest durable content (flag-only)

Read every BLI in `docs/sprint-<M>/` and split its content:

- **Ticketed BLIs** (filename carries a tracker key): acceptance criteria are
  canonical in the tracker — do not harvest them. Scan only for durable
  statements the tracker does not hold: explicit product rules ("org-contact
  mail always fans out to all contacts"), data-model and field-treatment
  decisions ("clear `answer`, keep `questionLabel`"), out-of-scope boundaries
  with lasting intent, shared-helper contracts.
- **Ticketless BLIs**: the BLI is the only spec that exists. Verify the
  changelog row is self-contained (one functional sentence); when the BLI
  holds spec value beyond that line, flag it.

Flagging: create `docs/todo/harvest-sprint-<M>-<topic>.md` — one item per
topic, not per BLI. Each item names the durable statement, the suggested home
(`docs/specs/`, `CONVENTIONS.md`, `rules/`), and the source recipe
(`git show sprint-<M>-bli-archive:docs/sprint-<M>/<file>`). Moving the content
into its home is follow-up work with its own review, never part of this run.

A folder of a dozen or more BLIs is worth a read-only subagent per sprint that
reports topics back instead of editing. Its report is a lead, not a fact: a
statement read from a BLI rather than checked in code is marked `verify` in the
harvest file, and a contradiction between a BLI and the code is settled with
one targeted search before it is written down as fact.

## Phase 2 — Link sweep

Find every reference to the folder before removing it, in the whole repository:

```bash
git grep -n -E "docs/sprint-<M>/|docs/sprint-<M>-gaps\.md" -- . ':!docs/sprint-<M>/' ':!docs/sprint-<M>-changelog.md'
rg -n "docs/sprint-<M>/|docs/sprint-<M>-gaps\.md" docs/todo/
```

- References in **active** documents (backlog items, specs, todos): rewrite to
  the harvested todo item or to the retrieval recipe. A link to the folder as a
  GitLab blob URL matches too: write the recipe as plain text, not as a link
  that points at a file that is gone.
- References inside `docs/sprint-<M>-changelog.md` itself become bare
  filenames — the `## Archief` section explains retrieval.
- References inside other not-yet-compacted sprint folders may stay; they get
  the same treatment when their own sprint is compacted.
- A reference from **code, tests or config** (an `@see` comment, a script's
  pointer to a runthrough document) is not a doc edit, and rewriting it makes
  the compaction diff non-docs-only. Leave it untouched in this run, list each
  file and line in the harvest todo under "Follow-up MR", and keep the file it
  names (Phase 4) — the same split as `commands/close-sprint.md` Phase 5.

## Phase 3 — Rewrite the changelog to the compact template

Rewrite `docs/sprint-<M>-changelog.md` to the template in
`commands/close-sprint.md` § Changelog template. Preserve per delivered item:
ticket key, the one-line functional summary, evidence (commit/MR), tracker
status. Move ⚠️ prose out of table cells into "Afwijkingen & vervolg" (one
bullet each). Collapse the narrative intro into "Verantwoording" bullets. Trim
review evidence to grouped code paths. Add the `## Archief` section with the
retrieval recipe. The full pre-compaction changelog stays reachable via the
same tag.

Two checks before the compact file replaces the original:

- **No item lost.** Save the original (`git show HEAD:docs/sprint-<M>-changelog.md`
  to a scratch file) and run
  `node skills/compact-sprint/scripts/check-changelog-keys.mjs <original> <compact>`
  (from the plugin or ai-workflows checkout). It
  fails on a ticket that headed a table row and is gone, and reports the size
  against the 15 KB target. The same check clears a draft a subagent wrote.
- **No stale snapshot.** A "partial", "not delivered" or "no call site uses X"
  line is a close-day statement. Re-check each against the integration branch
  before copying it into "Afwijkingen & vervolg", or date it ("stand
  <date>"); one targeted search per line is enough.

## Phase 4 — Remove the folder

```bash
git rm -r docs/sprint-<M>/
git rm docs/sprint-<M>-gaps.md
```

Before `git rm -r`, list the folder and set aside every file that a Phase 2 hit
outside `docs/` names, and any file that is not a BLI at all. Remove the rest
file by file with `git rm`, leave those in place, and name them under
`## Archief` and in the harvest todo's follow-up, with where they should
move. The folder then survives with only those files until that follow-up
lands.

The gaps document was read by sprint M+1's planning and has had no reader
since; the archive tag keeps it. A sprint closed before close-sprint cleared
working documents at close (its Phase 5b) may have left some behind — the
planning and refinement documents, a sprint folder under another spelling.
Sweep them with that phase's classification: a file that code, tests or config
reference is never removed here.

## Phase 5 — Review pause and handover

Print a summary per sprint: BLIs removed, todo items created, links rewritten,
changelog size before → after. Stop for user review of the diff.

Then hand the user the exact commands, **in this order** — the tag must land
on a commit that still contains the folder and the full changelog:

```bash
git tag sprint-<M>-bli-archive <sha>  # <sha> = the pre-compaction HEAD, before committing
git push origin sprint-<M>-bli-archive
# then commit the compaction diff via the normal MR/commit flow
```

Print the real sha (`git rev-parse --short HEAD`) in the command, and one tag
line per compacted sprint pushed in a single `git push`.

When the project merges via MRs, the pre-compaction HEAD on the integration
branch is already public, so the tag is safe to push immediately.

## Output

End with a concise list of:

- Todo items created (paths)
- Changelogs rewritten (size before → after)
- Folders and gaps documents removed, plus any leftover working documents
- References rewritten (count per file), and the code references left for
  their own MR (file and line)
- The tag + push commands handed to the user
