# Chore: The Request Measurement Gets a Pass/Fail Idle Check

## Status

<!-- draft | ready | in-progress | done -->

done

Filed 2026-10-21. Delivered the same day after the maintainer approved it, as
an MR stacked on the one that filed it.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

low

## Summary

"Behavioural changes need a measurement" in `npm-maintenance` counts `_rsc`
requests in DevTools and compares the numbers with production. It has no
pass/fail, and a headless run cannot carry it out, so the MR stays in Draft
waiting for a human. The OBA prefetch-loop item measured the same thing headless,
and it found a clear signature: in a loop, requests keep arriving in the last
10 s of a 30 s idle window, and one URL is fetched more than twice. This item
adds that check and the method.

## User Story

As the developer running a framework minor through `npm-maintenance`, I want the
request measurement to give a pass or a fail that an agent can produce headless,
so that a prefetch storm or loop is caught before deploy without someone sitting
in DevTools.

## Acceptance Criteria

- Step 1 of the measurement uses a headless browser instead of DevTools:
  - load each page and stay idle for 30 s;
  - count the requests that carry the framework's data marker (`_rsc` for Next);
  - sample every 5 s.
- The idle check fails when a marked request arrives in the last 10 s, or when
  one URL is requested more than twice. A failure keeps the MR in Draft, the
  same as a High verdict without a measurement.
- The volume comparison with production stays as it is, reported as numbers.
  This item adds no threshold for it.
- For an environment behind basic auth, the credentials come from the
  environment and are never printed. `curl` is no substitute: Vercel answers it
  with a bot challenge (`429`, `x-vercel-mitigated: challenge`).
- The method lives in `skills/npm-maintenance/references/request-measurement.md`.
  It includes a short script that the agent writes to the scratchpad. The script
  uses Playwright when the project already has it, and otherwise `puppeteer-core`
  through `npx` against the local Chrome. It adds no dependency to the project.
- The **Measurement** line of the block in `references/risk-analysis.md` §8
  gains the idle result: `idle: pass|fail (last 10 s: <n>, max per URL: <n>)`.
- A changelog fragment `changelog.d/changed.npm-maintenance-idle-request-check.md`.

## How to verify

- [x] `node scripts/validate-skills.mjs` passes.
- [x] The script from `references/request-measurement.md`, run once against a
      local `next start` of a scratch Next 16.4.2 app. The app has a home page
      linking to `/a`, `/b` and `/loop`, and a `/loop` page that calls
      `router.refresh()` every second as a positive control. Command:
      `node <scratch>/measure/measure-rsc.mjs --project <scratch>/idle-app http://localhost:3999/ http://localhost:3999/loop`,
      with puppeteer-core 25.15.0 against the local Chrome, outside the
      sandbox. Output:

      ```
      PASS http://localhost:3999/: _rsc total 6, last 10 s 0, max per URL 1, samples every 5 s 6 6 6 6 6 6
        1x /a /_tree (200)
        1x /b /_tree (200)
        1x /loop /_tree (200)
        1x /loop (200)
        1x /b /b/__PAGE__ (200)
      FAIL http://localhost:3999/loop: _rsc total 30, last 10 s 10, max per URL 30, samples every 5 s 4 9 14 20 25 29
        30x /loop (200)
      ```

      Exit code 1, because `/loop` fails the idle check.
- [x] The same command inside the command sandbox exits 2 with "The browser is
      already running for …": Chrome cannot start there. The reference says so.
- [ ] Reviewer: read step 1 of "Behavioural changes need a measurement" in
      `skills/npm-maintenance/SKILL.md`, the High row in
      `references/risk-analysis.md` §7 and the Measurement line in §8 side by
      side. They agree on when the MR stays in Draft.

## Technical Notes

**The signature, from OBA** (`docs/backlog/bug-collectie-link-prefetch-loop.md`
in the OBA website repo, closed 2026-09-28). Headless Chrome counted `_rsc`
requests over 30 s after load on `/nl`:

| Run | Total | In the last 10 s | Worst URL |
| --- | --- | --- | --- |
| Production, healthy | 34 | 0 | every link at most twice |
| Preview, looping | 659 | 186 | one link ×303 |
| Staging, looping | 303 | 95 | one link ×274 |

The healthy run and the loop are far apart on both counts, so the check needs no
tuning.

**Be clear about what it catches.** The OBA loop itself was not caused by a
bump. A missing `CATALOGUE_SOURCE` and a route shape set it off, so a check at
bump time would not have found that loop. The check finds the same signature
when a bump introduces it. That is the class behind the roughly 7× hosting cost
after next 16.2.12 → 16.3.x (`references/risk-analysis.md`, opening paragraph).
It also gives a human a ready method when the loop shows up some other way.

**The OBA method to reuse.** `puppeteer-core` with `page.authenticate` for basic
auth, URLs filtered on `_rsc`, sampled every 5 s, and the last 10 s reported.
Record each looping URL's status: OBA could not settle the cause because that
status was missing.

**Where it lands.**

- `skills/npm-maintenance/SKILL.md` "Behavioural changes need a measurement",
  step 1: point to the new reference, and add the pass/fail rule.
- `references/risk-analysis.md` §8: the Measurement line.
- The positive-control step (step 2) stays unchanged.

**Test level.** Prose plus a script snippet, checked in review. Run the snippet
once at delivery against a local `next start` of a Next project, and paste its
output into `How to verify`. `node scripts/validate-skills.mjs` must pass.

**Delivery notes (2026-10-21).**

- puppeteer-core is installed with `npm install --prefix <scratch>/measure`,
  not run through `npx`. Node resolves `import` from the script's location, so
  a package that `npx` fetched cannot be imported by a script outside it.
  Neither path touches the project.
- Requests are keyed by path plus Next's `Next-Router-Segment-Prefetch` header.
  Next 16 prefetches a link as separate segment requests (`/_tree`,
  `/b/__PAGE__`), so keying by path alone would count a healthy link more than
  once.
- The High row in §7 changed as well. It said a headless run always leaves the
  MR in Draft. Now that the measurement runs headless, Draft is only for a
  measurement that could not run or an idle check that failed.
- "After forced re-renders" from the old step 1 is gone. The headless method
  measures load plus idle, which is the state the loop signature lives in.

## Out of Scope

- When the measurement runs: still a framework minor, a prior revert, or a High
  verdict.
- Monitoring or alerts on production usage.
- Shipping the script as a plugin file or a project dependency.

## Related

- [../../skills/npm-maintenance/SKILL.md](../../skills/npm-maintenance/SKILL.md)
- [../../skills/npm-maintenance/references/risk-analysis.md](../../skills/npm-maintenance/references/risk-analysis.md)
- [chore-dependency-checks-run-every-declared-script.md](chore-dependency-checks-run-every-declared-script.md)
- OBA website repo: `docs/backlog/bug-collectie-link-prefetch-loop.md`, `docs/backlog/perf-search-link-prefetch-storm.md`
