---
name: release-notes
description: Write release notes a customer can read — plain-language, value-first notes for a release range or a closed sprint, in the customer's language, stating on which environment each change is live. Draft only: it never posts, and the tracker is read-only. Use when the user asks for release notes ("releasenotes", "release notes voor de klant"), a customer update, "wat is er live", or when close-sprint or sprint-demo hands off after its review pause.
---

# Release Notes Skill

Use this skill when the user asks for release notes, a customer update, or
"what is live now" — for a release between two refs or for a closed sprint.

The canonical step-by-step runbook lives at `commands/release-notes.md`. This
skill is a thin wrapper around that runbook so Codex, Cursor, and Claude Code
share the same workflow; Copilot follows the runbook directly.

Core principle: the notes describe what the customer can see or do now, and on
which environment. Everything the team needs to trace it — keys, commits, MRs —
stays in the sprint changelog and the appendix.

## Workflow

1. Read `commands/release-notes.md` (project root, or the synced `commands/`
   dir).
2. Confirm the scope key (release range or sprint), the production ref, the
   audience, and the language before collecting anything.
3. Follow the phases in order: sources by trust, classify for the customer,
   verify where each item is live, write, review pause. Do not skip Phase 4.

## Constraints

- **Draft only.** Never post to Jira, Slack, mail, Confluence, or a release
  page; the user shares the notes.
- **Never** run `git commit` — the user commits themselves.
- The issue tracker is **read-only**.
- **No internal identifiers in the body** — no ticket keys, SHAs, MR numbers,
  branch or file names. Keys live in the appendix only, and only for a
  product-owner audience.
- **Security as outcome, never as weakness.** Describe the protection the
  customer now has; when they must act, say what, not why.
- **Nothing is "live" without the ancestor check** against the production ref
  (`git merge-base --is-ancestor`). Merged to the integration branch is not
  live; an unverified item lands under the environment it is on.
- Stop and ask when an item's customer-visible effect is unclear — do not
  invent value.

## Inputs to confirm before starting

- Scope key: `<prev-tag>..<tag>`, `<production-ref>..<integration-ref>`, or
  `Sprint <N>` (default: last release tag to the integration branch head)
- Production ref (e.g. `origin/main`)
- Audience: product owner (default) or end users
- Language: the customer's (default Dutch, or what `CONVENTIONS.md` names)

## Output

`docs/releases/<key>.md` following the runbook's template (Nieuw, Verbeterd,
Opgelost, Goed om te weten, Waar staat het, plus the ticket appendix for a
product-owner audience), a paste-ready block in the reply, and the lists of
dropped internal items and not-yet-live items awaiting the user's decision.

## Hand-offs

- `skills/close-sprint` and `skills/sprint-demo` name this skill in their
  wrap-up. Their changelog and runsheet are this skill's first two sources;
  after the close, the flattened demo record `docs/sprint-<N>/demo.md` stands
  in for the runsheet.
- Projects that version their releases (`npm version`, a `v<x.y.z>` tag) run
  it per tag: the notes are the customer-facing half of that release, the
  sprint changelog stays the internal half.
