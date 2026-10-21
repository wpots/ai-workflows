# Feature: The Release Post Lists the MRs in Review

## Status

<!-- draft | ready | in-progress | done -->

ready

Filed 2026-10-21 from a question after the plugin demo: a channel with the
ai-workflows MRs, so whoever is interested sees which updates are proposed.
Ready check the same day: every point passes; flipped to `ready`
by the maintainer.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

medium

## Summary

The weekly release post in `#ai-workflows` shows what merged. The team asked to
see what is proposed, before it lands. A Slack post per MR would be about 50 posts a
week (100 MRs opened between 2026-10-07 and 2026-10-21), the noise that moved
the release posts out of `#development`. Instead, the release post gets an
"In review" block with the open MRs, so the team sees once a week what is coming
and where it can still weigh in.

## User Story

As a developer at Greenberry, I want the weekly release post to list the
ai-workflows MRs that are open for review, so that I can see what is about to
change and comment in the MR before it merges.

## Acceptance Criteria

- The release post has an "In review" block after "Wat is er nieuw" and before
  the footer, with one line per open MR: a link on `!<iid>`, the title, and the
  author's name.
- Draft MRs and the release MR itself (source branch `release/next`) are not
  listed.
- The list is ordered by creation date, oldest first, and holds at most 10
  lines. With more open MRs, a last line says how many more there are and links
  to the project's open MR list.
- With no open MR, the block holds one line saying so.
- When the open MRs cannot be read (no `RELEASE_BOT_TOKEN`, an API error), the
  post goes out without the block and the job log says why. The release
  announcement never fails on this lookup.
- `--dry-run` shows the block in its text preview and `--dry-run --json` in the
  payload, from the same lookup.

## How to verify

## Technical Notes

**Where it lands.**

- `scripts/release-announcement.mjs`: an exported pure function, for example
  `reviewBlocks(mergeRequests, projectUrl, max = 10)`, that takes the API's MR
  objects, drops drafts (`draft: true`) and `source_branch === "release/next"`,
  sorts by `created_at`, caps the list and returns the blocks. `buildAnnouncement`
  takes an optional `openMergeRequests`: an array renders the block, `null`
  leaves it out. Same shape as `syncPaths`, where `null` means "not known". The
  block is a `header` plus a `section`, both of which `toPlainMrkdwn` already
  renders.
- `scripts/announce-release.mjs`: before `buildAnnouncement`, read
  `GET ${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests?state=opened&per_page=100`
  with `PRIVATE-TOKEN: RELEASE_BOT_TOKEN`, the way `scripts/release-train.mjs`
  calls the API. Outside CI, fall back to `https://gitlab.com/api/v4` and the
  URL-encoded project path, like the `projectUrl` default. On a missing token or
  a non-OK response, pass `null` and log one line.
- `.gitlab-ci.yml`: nothing changes. `RELEASE_BOT_TOKEN` is a protected project
  variable, so `announce_release` on `main` already receives it. The bot token,
  not `CI_JOB_TOKEN`, because `release-train.mjs` already reads merge requests
  with it.
- Text, in the post's Dutch: header `👀 In review`, a lead line such as "Open
  MR's die op review wachten. Reageren kan in de MR." The maintainer may reword
  it in review.
- Escape titles with the existing `escapeMrkdwn`; a title with `<`, `>` or `&`
  must not break the link markup.
- `docs/contributing.md`, the `announce_release` bullet: name the new block and
  the token it reads with.

**Choices made.**

- One block in the existing weekly post, not a channel or a post per MR, given
  the volume above and the move of the release posts away from `#development`
  on 2026-10-20.
- Drafts left out: a draft is not yet proposed for review, and listing them
  would put the draft release MR in the post every week.
- No Slack mentions of authors: there is no GitLab-to-Slack user mapping in this
  repo, and a mention per MR turns an overview into a ping.

**Test level.** Unit tests in `scripts/test-release-automation.mjs`, which the
pre-commit gate runs: `reviewBlocks` with a draft, the release MR, 12 open MRs
(cap and "more" line), none (the one-line block) and a title with `<&>`; and
`buildAnnouncement` with `openMergeRequests: null` (no block) and with an array
(block between the changes and the footer). The fetch itself is checked by the
dry-run in `How to verify`.

**Changelog.** No fragment: the change is in the CI scripts, not in what the
plugin ships (the fragment rule in `.claude/rules/upstream-mr.md`).

## Out of Scope

- A Slack channel or a post per MR.
- Personal GitLab notifications (project bell → Custom → New merge request):
  anyone can switch those on without a change here.
- The thread reply with colleagues' MRs and their review state under the release
  post: that is the maintainer's personal skill, not this script.
- Showing approval or pipeline state per MR.

## Related

- [../../scripts/announce-release.mjs](../../scripts/announce-release.mjs)
- [../../scripts/release-announcement.mjs](../../scripts/release-announcement.mjs)
- [../contributing.md](../contributing.md): "Ship A Plugin Release"
