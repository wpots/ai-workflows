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

- **Retention guard:** never compact the current sprint or the previous one.
  With sprint N in progress, only sprints ≤ N-2 are eligible — the close of
  sprint N still cross-references the folder of sprint N-1.
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

1. Sprint number(s) to compact (default: every closed sprint older than the
   previous one that still has a `docs/sprint-<M>/` folder).
2. The current sprint number N — infer from the highest
   `docs/sprint-*` folder/changelog plus the tracker, and confirm; the
   retention guard depends on it.

## Phase 0 — Preconditions

1. Run from an up-to-date integration branch (`development` by default):
   clean working tree, `git fetch` + `git pull --ff-only` — same as
   close-sprint Phase 0.
2. For each target sprint M verify, refusing the sprint when a check fails:
   - M ≤ N-2 (retention guard);
   - `docs/sprint-<M>/` exists;
   - `docs/sprint-<M>-changelog.md` exists.

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

## Phase 2 — Link sweep

Find every reference to the folder before removing it:

```bash
rg "docs/sprint-<M>/" docs/ rules/ commands/ README.md
```

- References in **active** documents (backlog items, specs, todos): rewrite to
  the harvested todo item or to the retrieval recipe.
- References inside `docs/sprint-<M>-changelog.md` itself become bare
  filenames — the `## Archief` section explains retrieval.
- References inside other not-yet-compacted sprint folders may stay; they get
  the same treatment when their own sprint is compacted.

## Phase 3 — Rewrite the changelog to the compact template

Rewrite `docs/sprint-<M>-changelog.md` to the template in
`commands/close-sprint.md` § Changelog template. Preserve per delivered item:
ticket key, the one-line functional summary, evidence (commit/MR), tracker
status. Move ⚠️ prose out of table cells into "Afwijkingen & vervolg" (one
bullet each). Collapse the narrative intro into "Verantwoording" bullets. Trim
review evidence to grouped code paths. Add the `## Archief` section with the
retrieval recipe. The full pre-compaction changelog stays reachable via the
same tag.

## Phase 4 — Remove the folder

```bash
git rm -r docs/sprint-<M>/
```

## Phase 5 — Review pause and handover

Print a summary per sprint: BLIs removed, todo items created, links rewritten,
changelog size before → after. Stop for user review of the diff.

Then hand the user the exact commands, **in this order** — the tag must land
on a commit that still contains the folder and the full changelog:

```bash
git tag sprint-<M>-bli-archive      # on the pre-compaction HEAD, before committing
git push origin sprint-<M>-bli-archive
# then commit the compaction diff via the normal MR/commit flow
```

When the project merges via MRs, the pre-compaction HEAD on the integration
branch is already public, so the tag is safe to push immediately.

## Output

End with a concise list of:

- Todo items created (paths)
- Changelogs rewritten (size before → after)
- Folders removed
- References rewritten (count per file)
- The tag + push commands handed to the user
