# Chore: Enforce the improve-skill Retrospective With a Stop Hook

## Status

in-progress

Rewritten 2026-10-08 from the October 2026 stack review. The 2026-07-29
blocker was "no observable predicate for 'this run needed intervention'". That
is resolved: a `Stop` hook receives `transcript_path`, `session_id`,
`stop_hook_active` and `last_assistant_message`, and plugins ship hooks in
`hooks/hooks.json` (it already holds four). Premise corrections against `main`:
the hook belongs in `hooks/hooks.json`, not in `templates/project-claude-settings.json`
— a plugin hook reaches every developer and every already-synced project, which
the template route could not (`sync.sh` does not update an existing project
`.claude/settings.json`), and this repo gets it by having the plugin enabled.

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 2

## Priority

medium

## Summary

"After any skill run that required user intervention, run `skills/improve-skill`"
is prose, and nothing enforces it. Ship a `Stop` hook with the plugin that
notices when a Greenberry skill ran and the run needed intervention, and asks
once per session whether to run the retrospective. This is the last policy
marked "enforced by nothing" in `docs/pipeline-map.md`.

## User Story

As a maintainer of ai-workflows, I want the harness to prompt for the
retrospective after a session that needed corrections, so that friction gets
folded back into the skill instead of being noticed and forgotten.

## Acceptance Criteria

- [x] `scripts/improve_skill_retrospective.py` reads the Stop hook JSON from
      stdin, scans the file at `transcript_path`, and on a match prints
      `{"decision": "block", "reason": "<text>"}`; otherwise it prints nothing
      and exits 0.
- [x] A match needs all of: an assistant `tool_use` with `name: "Skill"` whose
      `input.skill` starts with `greenberry:` and is not `greenberry:improve-skill`;
      after it, one intervention signal, matched on entry structure and never on
      raw text — a user entry whose text starts with `[Request interrupted by
      user`; a `tool_result` with `is_error: true` whose text starts with "The
      user doesn't want to proceed with this tool use"; or a human turn
      (`origin.kind == "human"`) while the latest tool result is a failure, so a
      later successful tool result clears the error; `stop_hook_active` is false;
      no marker file for this `session_id` yet; and no later
      `greenberry:improve-skill` call. The hook writes the marker when it blocks,
      so it blocks at most once per session.
- [x] Any error (missing file, unreadable line, unexpected shape) and a missing
      `CLAUDE_PLUGIN_DATA` exit 0 with no output: the hook never breaks a session.
- [x] The `reason` asks Claude to offer the retrospective in one sentence and
      states that it must not run `improve-skill` or edit any skill unless the
      user says yes.
- [x] `hooks/hooks.json` registers the script under `Stop` with the same
      `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/…"` shape as the existing hooks.
- [x] `scripts/test_improve_skill_retrospective.py` covers the six required
      transcripts — clean skill run, interrupt after a skill call, explicit
      rejection, error then correction, no skill call, `improve-skill` already
      ran — plus the cases the evidence added (see Technical Notes), and is
      called from `scripts/validate-ai-instructions.sh` next to the two existing
      hook tests.
- [x] The MR description carries a fire-rate report: of the local transcripts for
      this repo that ran a Greenberry skill, how many the hook would fire on, one
      line each (session id prefix, signal). The reviewer judges precision from it.
- [x] `docs/pipeline-map.md` drops "enforced by nothing" from the `improve-skill`
      row and removes gap row 9; `ENFORCED_BY_NOTHING_BUDGET` in
      `scripts/validate-skills.mjs` goes from 1 to 0 (the validator asks for it
      once the last marker is gone); `docs/contributing.md` documents the hook
      next to `scripts/install-hooks.sh`, saying which is the git hook and which
      the plugin hook. The prose rule stays as documentation of intent.

## How to verify

Stays `in-progress` until the first check below is ticked: it needs a live session
with the plugin enabled, and three things it depends on come from the hooks
documentation and were not observed — that Claude Code honours `decision: block`
from a plugin `Stop` hook, that it passes `session_id` and
`CLAUDE_PLUGIN_DATA` to it, and that Claude then offers instead of running.

- [ ] By hand, with this plugin enabled: run a Greenberry skill, press Esc to
      interrupt it, send a message, and let the turn end. Claude should ask in one
      sentence whether to run `improve-skill`, and not run it unless told to. A
      second interruption in the same session must not ask again.
      `${CLAUDE_PLUGIN_DATA}/improve-skill-retrospective/<session id>` should hold
      the signal name (`interrupt`).
- [x] `python3 scripts/test_improve_skill_retrospective.py` — 15 tests pass: the
      six required transcripts, a signal before the skill call, a non-Greenberry
      skill, quoted phrases in `attachment`, `tool_result` and assistant entries,
      a task notification after an error, `stop_hook_active`, a missing data dir,
      a missing transcript and malformed lines, and an error the run recovered
      from followed by an approval.
- [x] Fire-rate report over the 11 main-session transcripts of this repo on
      2026-10-08: 5 ran a Greenberry skill; the shipped hook fires on 0 of them.
      The rule as first specified (any failed tool result followed later by a
      human turn) fired on 4 of the 5; see Technical Notes for why it was
      tightened.
- [x] A 20 MB transcript costs 0.10 s in the worst case (skill call first, every
      later line parsed) and 0.08 s with no Greenberry skill in it.
- [x] `node scripts/validate-skills.mjs` — no warning about the budget at 0, and
      `bash scripts/validate-ai-instructions.sh` — all suites pass, no adapter
      drift.

## Technical Notes

What the transcripts show, from the 11 main-session transcripts of this repo on
2026-10-08. A Skill call is an assistant content block
`{"type":"tool_use","name":"Skill","input":{"skill":"greenberry:<name>", …}}`.
`tool_result.is_error` is `true` on errors but `null` on several tool types, so
test for `is_error is True`. A human turn is a user entry with
`origin.kind == "human"`; a background-task notification arrives as a user entry
with `origin.kind == "task-notification"` and is not a correction.

Correction to this item as filed, which said the interrupt marker occurs in
"nearly every" one of ~60 transcripts and that the rejection text is "rare": that
count included workflow subagent transcripts, which a `Stop` hook never receives,
and entries that merely quote the phrases (memory notes and backlog items surface
in `attachment` entries and in the `tool_result` of file reads and edits). No
genuine interrupt, explicit rejection or permission-denied wording appears in any
main-session transcript here. A genuine interrupt exists only in subagent
transcripts, as a user entry whose text is `[Request interrupted by user]`. So the
hook matches entry structure, never raw substrings, and the interrupt and
rejection signals are implemented from that structure and tested on constructed
entries only.

The third signal as first specified — any failed tool result followed later by a
human turn — fired on 4 of the 5 sessions that ran a Greenberry skill, and three
of the four were approvals ("post them", "yes", "it is merged") 75–270 entries
after an unrelated tool error (a missing `Grep`, a bad path, the known
`glab --state` flag). The shipped rule counts an error only while it is the run's
latest tool outcome; a later successful tool result clears it. That fires on 0 of
the 5. It stays quiet where the evidence says to, at the price of being unproven
on a real intervention: the first real interrupt or rejection is the test of it.

The hooks reference gives no JSONL schema for the transcript and says the file is
written asynchronously and can lag the current turn. This predicate reads
earlier entries, so lag is tolerable; do not read the final message from the
file, `last_assistant_message` exists for that. Prefilter cheaply: read line by
line and, until the first Greenberry skill call is found, parse only lines that
contain both `greenberry:` and `"Skill"`, so a session that never ran one costs a
substring scan on every Stop.

Decision recorded in this rewrite, to revisit at review: the July draft said the
hook must never block. Blocking exactly once is what makes the prompt reach the
user at all (a Stop hook that only adds context cannot ask a question), and the
one-per-session marker plus `stop_hook_active` bound the loop risk the hooks
reference warns about. Keep the marker in the plugin data directory
(`${CLAUDE_PLUGIN_DATA}`), keyed by `session_id`.

No agent-type judge in this item. Agent hooks are experimental and cost tokens
on every Stop; if the fire-rate report shows the command predicate misses real
interventions, a judge for the ambiguous case is its own follow-up.

The change ships with the plugin: describe it in a fragment,
`changelog.d/added.improve-skill-stop-hook.md` (the convention since the 2.6.0
release), and leave `CHANGELOG.md` and `version` in `.claude-plugin/plugin.json`
alone.

## Out of Scope

- Automatically running `skills/improve-skill`, or editing a skill from the hook.
- An agent-type or prompt-type judge.
- `templates/project-claude-settings.json` and anything under `sync.sh`.
- Hooks for other workflows (create-pr, run-checks).
- Any change to `scripts/install-hooks.sh`.

## Related

- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/156
- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../hooks/hooks.json](../../hooks/hooks.json)
- [../../scripts/improve_skill_retrospective.py](../../scripts/improve_skill_retrospective.py)
- [../../scripts/test_improve_skill_retrospective.py](../../scripts/test_improve_skill_retrospective.py)
- [../../scripts/prefer_service_cli.py](../../scripts/prefer_service_cli.py)
- [../../scripts/test_prefer_service_cli.py](../../scripts/test_prefer_service_cli.py)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- [../pipeline-map.md](../pipeline-map.md)
- https://code.claude.com/docs/en/hooks
