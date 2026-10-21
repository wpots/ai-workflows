# Dependency risk analysis

Every MR that moves a dependency carries a risk analysis: what can change in
production that lint, tests and the build do not cover. Renovate's MR body gave
reviewers the release notes for the whole range and Merge Confidence (age,
adoption). This keeps both and adds what Renovate never did: whether this
project uses what changed, and which line of the hosting bill it can move.

The reason: next 16.2.12 → 16.3.x passed lint, tests and the build, shipped,
and raised hosting cost about 7× through a change in request behaviour. The
release notes were public. Nobody connected them to this project's `<Link>`
usage and its Vercel bill.

Everything below runs on CLIs and public APIs (`npm`, `gh`, `curl`, `rg`), so
it also works headless. Nothing here installs, builds or deploys. Work in a
scratch directory, not in the project.

## Scope

- Every direct dependency that moves, with its lockstep packages grouped under
  it (`@next/*` and `eslint-config-next` under `next`, `@payloadcms/*` under
  `payload`).
- A transitive package only when it moves through an `overrides` entry or
  across a minor. The other transitive moves get one summary line.
- Inventory mode does not run this: nothing moves.

## 1. Range

- **From**: the exact version in the lockfile of the MR's target branch, never
  the `package.json` range. When production runs another version
  (`git show origin/<production>:package-lock.json`), name it as well: the
  release carries production across the whole range, not only this MR's part.
- **Versions in range**: `npm view <pkg> versions --json`, keeping every
  version above *from* and up to *to*, without prereleases.
- **Jump**: patch, minor or major. Say "crosses a minor" explicitly when it
  does. A security fix that lands on the next minor is a minor change for
  production, whatever the advisory calls it.

## 2. What changed

1. **Release notes for every version in range**, not only the minor's
   announcement. Get the repo with `npm view <pkg> repository.url`, then fetch
   each release by tag:

   ```sh
   gh api repos/<owner>/<repo>/releases/tags/v<version> --jq '.body'
   ```

   Monorepos tag differently (`<pkg>@<version>`); list the tags when the first
   guess returns 404. Fall back to `CHANGELOG.md` at the target tag. When
   neither exists, write "no release notes found". That counts as a finding,
   not a clean range.
2. **Classify** the entries that can matter at runtime and drop the rest
   (docs, tests, internal refactors):
   - breaking;
   - behaviour or default change;
   - request, caching or rendering pattern: prefetching, revalidation, cache
     headers, image optimisation, middleware matching, data fetching, bundle
     splitting;
   - deprecation;
   - security fix.
3. **Defaults diff** for a framework (Next, Nuxt, Remix, Expo, Payload): fetch
   its config-defaults file at both tags and diff them. A flipped default is a
   behaviour change the app never opted into.

   ```sh
   gh api "repos/vercel/next.js/contents/packages/next/src/server/config-shared.ts?ref=v<from>" \
     -H "Accept: application/vnd.github.raw" > <scratch>/from.ts
   # same for v<to>, then: diff <scratch>/from.ts <scratch>/to.ts
   ```

## 3. Exposure in this project

For every entry in the behaviour, default and request-pattern classes, search
the project for the API, component, config key or route convention it
concerns. Include `next.config.*`, middleware, and route-segment config
(`export const revalidate`, `dynamic`, `fetchCache`). Record it as
"used: `path:line`, n hits" or "not used here".

This step turns a generic changelog into a risk for this project. A change the
project does not touch drops out of the verdict.

## 4. Cost surface

Read `## Hosting` in `CONVENTIONS.md`: the platform, its cost-sensitive
metrics and a baseline. When the section is missing, infer the platform from
the repo (`vercel.json`, `netlify.toml`, `clevercloud/`, `CC_*` variables in
`.env.example`) and write "hosting not recorded in CONVENTIONS.md" in the
block.

Connect each exposed change to the metric it can move. For example, more
prefetch or data requests move Vercel Function Invocations, Edge Requests and
Firewall Rate Limit Requests, or the instance count on an autoscaling host. Never invent a baseline:
"baseline unknown — read it on <usage page>" is a valid value.

## 5. Maturity

| Signal | Command | Flag |
| --- | --- | --- |
| Age of the target | `npm view <pkg> time --json \| jq -r '."<to>"'` | younger than 7 days |
| Position on its minor | the versions list from §1 | `x.y.0` or `x.y.1` |
| Adoption | `curl -s https://api.npmjs.org/versions/<pkg>/last-week \| jq '.downloads["<to>"]'` (scoped: `@scope%2Fname`) | report as a share of last week's downloads |
| Open upstream regressions | `gh search issues --repo <owner>/<repo> "<to>" --state open --sort created --limit 20 --json number,title,createdAt` | titles that touch an exposed feature |

The 7-day flag is Renovate's `minimumReleaseAge`. An exact-version install
avoids the case of a range resolving to a minor published that week, but it
does not make a week-old target mature.

## 6. History

Use the per-package history check from `skills/npm-maintenance/SKILL.md` §1
step 5. A revert of the same package, above all on the same version line, is
part of the analysis. Name the commit and its reason.

## 7. Verdict

The highest level that applies wins.

| Level | When |
| --- | --- |
| **High** | major; a prior revert of this package; a behaviour, default or request-pattern change the project uses **and** that sits on a cost surface; a framework minor with no release notes found |
| **Medium** | any other minor; an exposed behaviour change without a cost surface; a target younger than 7 days, or an `x.y.0` or `x.y.1`; an open upstream regression on an exposed feature |
| **Low** | patch range, nothing exposed, no flag from §5 or §6 |

| Level | What it means for the MR |
| --- | --- |
| Low | Ready for review, with the block in the description. |
| Medium | Ready for review. "Watch after deploy" names a concrete metric and where to read it. |
| High | Draft until the measurement in `skills/npm-maintenance/SKILL.md` ("Behavioural changes need a measurement") has run, its idle check passed, and its numbers are in the block. A headless run carries the measurement out with `references/request-measurement.md`. It leaves the MR in Draft, with the measurement as an open action for a human, only when the measurement could not run (no local build, no browser) or its idle check failed. A hotfix follows its own rule (`skills/dependency-hotfix/SKILL.md` Step 3). |

## 8. The block in the MR description

Write it in the language of the rest of the description. Use one table row per
package or lockstep group, and detail only Medium and High rows. A Low row
needs nothing beyond its table line.

```md
## Risk analysis

| Package | From → to | Jump | Target age · adoption | Verdict |
| --- | --- | --- | --- | --- |
| next (+ @next/third-parties, eslint-config-next) | 16.2.12 → 16.3.4 (production: 16.2.12) | crosses a minor | 9 d · 6 % | **High** |
| zod | 4.1.11 → 4.1.12 | patch | 21 d · 18 % | Low |

### next — High

**Changes in range** (every release 16.2.13 … 16.3.4)
- [v16.3.0](<release link>): <entry, quoted or paraphrased>
  → used here: `<Link>` without a `prefetch` prop, 41 hits, e.g. `src/components/Nav.tsx:12`
- Default `<key>`: <old> → <new> (config-shared.ts, v16.2.12 → v16.3.4)

**Cost surface**: Vercel Function Invocations and Edge Requests. Baseline ~<n>/day (<usage page>).
**History**: <revert sha> "<subject>" — <reason>, or "no earlier bump or revert".
**Upstream**: <open regression issues that touch an exposed feature>, or "none found".
**Measurement**: `_rsc` requests home/list over load + 30 s idle: production <n> · target <n> · known-bad <n>; idle: pass|fail (last 10 s: <n>, max per URL: <n>), or "open — required before this leaves Draft".
**Watch after deploy**: <metric> in the first hour on <page>; act above <threshold>.
**Rollback**: revert this MR and redeploy <previous tag or commit>.
```

Report what the sources say. When a source fails (rate limit, 404, no repo
URL), write that in the block. A missing source is not a clean result.
