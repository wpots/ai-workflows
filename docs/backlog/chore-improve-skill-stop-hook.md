# Chore: Enforce the improve-skill Retrospective With a Stop Hook

## Status

ready

Rewritten 2026-10-08 from the October 2026 stack review. The 2026-07-29
blocker was "no observable predicate for 'this run needed intervention'". That
is resolved: a `Stop` hook receives `transcript_path`, `session_id`,
`stop_hook_active` and `last_assistant_message`, and plugins ship hooks in
`hooks/hooks.json` (it already holds four). Premise corrections against `main`:
the hook belongs in `hooks/hooks.json`, not in `templates/project-claude-settings.json`
— a plugin hook reaches every developer and every already-synced project, which
the template route could not (`sync.sh` does not update an existing project
`.claude/settings.json`), and this repo gets it by having the plugin enabled.

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

- [ ] `scripts/improve_skill_retrospective.py` reads the Stop hook JSON from
      stdin, scans the file at `transcript_path`, and on a match prints
      `{"decision": "block", "reason": "<text>"}`; otherwise it prints nothing
      and exits 0.
- [ ] A match needs all of: an assistant `tool_use` with `name: "Skill"` whose
      `input.skill` starts with `greenberry:` and is not `greenberry:improve-skill`;
      after it, an intervention signal (one of: the `[Request interrupted by user]`
      marker, the text "The user doesn't want to proceed with this tool use",
      or a `tool_result` with `is_error: true` followed by a plain-text user
      turn); `stop_hook_active` is false; no marker file for this `session_id`
      yet; and no later `greenberry:improve-skill` call. The hook writes the
      marker when it blocks, so it blocks at most once per session.
- [ ] Any error (missing file, unreadable line, unexpected shape) exits 0 with
      no output: the hook never breaks a session.
- [ ] The `reason` asks Claude to offer the retrospective in one sentence and
      states that it must not run `improve-skill` or edit any skill unless the
      user says yes.
- [ ] `hooks/hooks.json` registers the script under `Stop` with the same
      `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/…"` shape as the existing hooks.
- [ ] `scripts/test_improve_skill_retrospective.py` covers six fixture
      transcripts — clean skill run, interrupt after a skill call, explicit
      rejection, error then correction, no skill call, `improve-skill` already
      ran — and is called from `scripts/validate-ai-instructions.sh` next to
      the two existing hook tests.
- [ ] The MR description carries a fire-rate report: of the most recent local
      transcripts for this repo that ran a Greenberry skill, how many the hook
      would fire on, one line each (session id prefix, signal). The reviewer
      judges precision from it.
- [ ] `docs/pipeline-map.md` drops "enforced by nothing" from the `improve-skill`
      row and removes gap row 9; `ENFORCED_BY_NOTHING_BUDGET` in
      `scripts/validate-skills.mjs` goes from 1 to 0 (the validator asks for it
      once the last marker is gone); `docs/contributing.md` documents the hook
      next to `scripts/install-hooks.sh`, saying which is the git hook and which
      the plugin hook. The prose rule stays as documentation of intent.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

What the transcripts show, from the maintainer's ~60 local transcripts for this
repo on 2026-10-08. A Skill call is an assistant content block
`{"type":"tool_use","name":"Skill","input":{"skill":"greenberry:<name>", …}}`.
`tool_result.is_error` is `true` on errors but `null` on several tool types, so
test for `is_error is True`. The `[Request interrupted by user]` marker occurs in
nearly every transcript, so it only counts after a Greenberry skill call, and the
fire-rate report is how its noise is judged. The explicit-rejection text is rare.
No permission-denied or hook-block wording appears anywhere, so the hook does not
look for it: do not add signals nobody has observed.

The hooks reference gives no JSONL schema for the transcript and says the file is
written asynchronously and can lag the current turn. This predicate reads
earlier entries, so lag is tolerable; do not read the final message from the
file, `last_assistant_message` exists for that. Prefilter cheaply: read line by
line and parse JSON only for lines containing `greenberry:`, so a large
transcript costs little on every Stop in every session.

Decision recorded in this rewrite, to revisit at review: the July draft said the
hook must never block. Blocking exactly once is what makes the prompt reach the
user at all (a Stop hook that only adds context cannot ask a question), and the
one-per-session marker plus `stop_hook_active` bound the loop risk the hooks
reference warns about. Keep the marker in the plugin data directory
(`${CLAUDE_PLUGIN_DATA}`), keyed by `session_id`.

No agent-type judge in this item. Agent hooks are experimental and cost tokens
on every Stop; if the fire-rate report shows the command predicate misses real
interventions, a judge for the ambiguous case is its own follow-up.

The change ships with the plugin: describe it under `## [Unreleased]` in
`CHANGELOG.md` and leave `version` in `.claude-plugin/plugin.json` alone.

## Out of Scope

- Automatically running `skills/improve-skill`, or editing a skill from the hook.
- An agent-type or prompt-type judge.
- `templates/project-claude-settings.json` and anything under `sync.sh`.
- Hooks for other workflows (create-pr, run-checks).
- Any change to `scripts/install-hooks.sh`.

## Related

- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../hooks/hooks.json](../../hooks/hooks.json)
- [../../scripts/prefer_service_cli.py](../../scripts/prefer_service_cli.py)
- [../../scripts/test_prefer_service_cli.py](../../scripts/test_prefer_service_cli.py)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- [../pipeline-map.md](../pipeline-map.md)
- https://code.claude.com/docs/en/hooks
