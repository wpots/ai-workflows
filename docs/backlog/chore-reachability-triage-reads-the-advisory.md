# Chore: Reachability Triage Reads the Advisory, and Unknown Counts as Reachable

## Status

<!-- draft | ready | in-progress | done -->

draft

Filed 2026-10-21. Proposed for `ready`: no product question open.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

high

## Summary

`npm-maintenance` §4 says to check reachability before ranking urgency, with
the example "An SVG-decoder bug matters little in an app that never decodes
SVG". On 2026-10-21 a reachability call went wrong in exactly that way.

- The release-note title of GHSA-2464-fhr4-w9xw said "when SVG files are used".
- The advisory itself describes a memory bug in sharp/libvips that allows RCE
  when Next runs on glibc-based Linux. The condition is a sharp version below
  `0.35.5`.
- innovatieroute's production lockfile has sharp `0.35.3`, plus `0.34.5` nested
  under `next`.
- A grep for `dangerouslyAllowSVG` produced "probably not reachable" for a
  critical RCE that may well be reachable.

`dependency-hotfix` has no reachability step at all. The rule now says how to
triage and what an unknown result means.

## User Story

As the developer deciding between a hotfix and the next release, I want the
reachability verdict built from the advisory's own conditions, with evidence
for each, so that a wrong "not reachable" can never quietly leave a critical
running on production.

## Acceptance Criteria

- In `npm-maintenance` §4, the bullet "Check whether the vulnerable code path is
  reachable" becomes a short triage procedure:
  - Read the advisory's own text: impact, workarounds and patched versions. The
    title, a release-note line or the scanner's summary is not enough.
  - List every condition the advisory names: the vulnerable component and its
    version, including a transitive one (sharp under next); the runtime or
    platform (glibc, Node version); the configuration or feature it needs
    (`use cache`, image optimization, a config flag).
  - Check each condition against production: its lockfile, config and code.
    Record evidence per condition: the lockfile entry, a `path:line`, a config
    key.
  - Give one of three verdicts:
    - `reachable`;
    - `not reachable`: every condition was checked and at least one fails, with
      evidence for that one;
    - `unknown`, which counts as reachable.
- The SVG-decoder example sentence is removed.
- The verdict still decides only between a hotfix and the next release, never
  whether the fix goes in.
- A critical moves from a hotfix to the next release only when a person
  decides it, with the verdict and its evidence recorded in the critical ticket
  or the MR. The skill never makes that move on its own.
- `dependency-hotfix` Step 2 gets one bullet: per advisory, run the triage from
  `npm-maintenance` §4, and put the verdict in the plan. The Step 3 plan example
  gains a `Reachable` line. A `not reachable` verdict does not stop the hotfix:
  it is information for the person who gives the go.
- An eval case `evals/npm-maintenance/npm-maintenance-<n>`, runnable with the
  facts in the prompt: GHSA-2464's title and advisory text, the sharp versions in
  the production lockfile, no `dangerouslyAllowSVG`, `images.loader: "custom"`,
  and a Debian-based Node image. Graders:
  - the verdict is not `not reachable`;
  - it names the sharp version below `0.35.5` as a condition that holds;
  - it does not rest the verdict on `dangerouslyAllowSVG`;
  - it does not move the critical to the next release on its own.

  Take the next free number at delivery, and follow `evals/README.md`.
- A changelog fragment `changelog.d/changed.reachability-triage-reads-the-advisory.md`.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

**The facts behind the example** (read 2026-10-21):

- GHSA-2464-fhr4-w9xw, Impact: "A memory-related vulnerability has been
  discovered in an upstream library used for Image Optimization can lead to
  possible remote code execution (RCE) when Next.js runs on glibc-based Linux."
- Its workaround: sharp `>= 0.35.5`.
- Affected: `>= 10.0.0 <= 15.5.27` (fixed in 15.5.28) and `> 16.0.0 <= 16.4.0`
  (fixed in 16.4.1).
- innovatieroute `main`: `node_modules/sharp` is `0.35.3`, and
  `node_modules/next/node_modules/sharp` is `0.34.5`.
- `next.config.js` sets `images.loader: "custom"` with a `loaderFile`. Whether
  `/_next/image` stays reachable from outside with a custom loader was not
  settled, so the verdict is `unknown`, which counts as reachable.
- GHSA-673q-mjm6-r5xr says outright: "You should upgrade immediately even if
  your application does not have similar functions." An advisory that says this
  makes the verdict irrelevant to urgency.

**Where it lands.**

- `skills/npm-maintenance/SKILL.md` §4: the last bullet under "A finding from an
  external scanner" grows into a subsection after it (`### Is the vulnerable
  code reachable?`). The triage applies to any advisory, not only to scanner
  findings.
- `skills/dependency-hotfix/SKILL.md` Step 2: one bullet. Step 3: the
  `Reachable` line in the plan example.

**Overlap.** `chore-dependency-hotfix-release-age-gate.md` also adds a bullet to
Step 2. Whichever lands second rebases.

**Test level.** The eval case covers the trap. The hotfix bullet is prose,
checked in review. Run `node scripts/validate-skills.mjs`. No `description`
changes, so the routing evals do not run.

## Out of Scope

- Reachability in the dependency scanner. Decided against on 2026-10-21: a wrong
  "not reachable" hides a critical, and the scanner's prod/dev scope, KEV and
  EPSS are the reachability filters that hold up. The scanner gap that matters,
  advisories missing from OSV, is tracked in Jira (see Related).
- osv-scanner call analysis, which covers Go and Rust only.
- VEX or ignore files (`osv-scanner.toml` `[[IgnoredVulns]]`).

## Related

- [../../skills/npm-maintenance/SKILL.md](../../skills/npm-maintenance/SKILL.md)
- [../../skills/dependency-hotfix/SKILL.md](../../skills/dependency-hotfix/SKILL.md)
- [chore-dependency-hotfix-release-age-gate.md](chore-dependency-hotfix-release-age-gate.md)
- [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr)
- [DEV-696](https://greenberry.atlassian.net/browse/DEV-696): the dependency scanner picks up vendor advisories that OSV does not have yet
