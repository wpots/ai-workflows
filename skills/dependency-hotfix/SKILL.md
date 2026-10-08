---
name: dependency-hotfix
description: Ship a critical npm vulnerability from the Greenberry dependency-scanner report as a hotfix — minimal bump with a risk analysis on a hotfix branch off the production branch, MR to production with GitLab auto-merge, then back-merge production into acceptance and development, with a Slack thread for the team, a Monitor loop over the MR, the deploy and the back-merges, and worktree and branch cleanup at the end. Resumable across sessions. Use when a critical from the dependency scanner (or any critical advisory running on production) is picked up ("pak de critical op", "critical hotfix", "dependency hotfix", "security hotfix naar main", "scanner critical"), or when an earlier hotfix run needs resuming.
metadata:
  owner: wieteke.pots
---

# Dependency hotfix

A critical runs on production, so its fix goes to production first — not
through development and the next release. The scanner's policy gives a
critical 24–72 hours. This skill owns the whole path in one run: read the
report, bump, MR with auto-merge, deploy read-back, back-merge into the other
long-lived branches, tell the team, clean up.

One project per invocation. Criticals only: highs and lower go through
`skills/npm-maintenance` on development, as regular maintenance.

## What this skill writes — one go covers it

Everything outward-facing is listed in the plan of Step 3 and approved there
in **one** go. Nothing leaves the machine before it, and nothing beyond it.
The local part of Step 4 — worktree, install, validation — is reversible, so
run it before asking: the go then covers a change that is already verified.

The go covers:

- a hotfix branch, its MR to the production branch, and GitLab auto-merge on
  that MR (the merge itself still waits for a human approval and a green
  pipeline);
- the back-merge of production into acceptance and development, as pushes or
  MRs depending on the project's merge settings (Step 3);
- the version, changelog section, tag and GitLab Release, when the project's
  hotfix runbook asks for them;
- Slack posts in `#merge_requests`: one parent message, then thread replies.
- one subtask under the tracker's maintenance ticket of the current quarter,
  for the hotfix MR. The parent ticket itself is never touched.

Never: approve the hotfix MR yourself, merge past a red pipeline, force-push,
push to the production branch directly, bump across a major, or resolve a
conflict in source code. Each of those stops the run and reports.

## Step 0 — Resume or start

A run spans hours (it waits for a reviewer), so look for an earlier one first.
Hotfix branches are named `hotfix/deps-<package>-<version>`, or
`hotfix/deps-<yyyy-mm-dd>` when several packages move together.

```sh
git fetch origin
glab api "projects/<enc-path>/merge_requests?state=all&search=deps&in=title&order_by=updated_at&per_page=20" \
  | jq '.[] | select(.source_branch | test("^(hotfix/deps-|backmerge/)")) | {iid, state, source_branch, target_branch, web_url}'
```

| Found | Resume at |
| --- | --- |
| open hotfix MR | Step 6 (Slack: reply in the existing thread when its link is in the MR description) |
| merged hotfix MR, production not yet an ancestor of acceptance or development | Step 8 |
| merged and back-merged | Step 9 — verify and clean up |
| nothing | Step 1 |

## Step 1 — Read the scanner report

The report site is behind GitLab Pages access control, so a CLI cannot read
it. Read the JSON artifact through the API instead — same data, every branch:

```sh
# newest scheduled scan
glab api "projects/greenberrynl%2Fthe-greenhouse%2Fdependency-scanner/jobs/artifacts/main/raw/report.json?job=dependency-scan" > <scratch>/report.json
# a specific scan: a report URL ending in /-/jobs/<id>/artifacts/report.html gives the job id
glab api "projects/greenberrynl%2Fthe-greenhouse%2Fdependency-scanner/jobs/<id>/artifacts/report.json" > <scratch>/report.json
```

Select the project by its GitLab path:
`jq '.projects[] | select(.path=="<group/path>")' <scratch>/report.json`.

| Field | Meaning |
| --- | --- |
| `.branch` | production branch (`main`, or `master` when there is no `main`) |
| `.findings[]` | production findings: `package`, `version`, `severity`, `fixedIn`, `id` (GHSA), `summary`, `isNew` |
| `.byBranch.<branch>.findings[]` | the same for `acceptance` and `development` |
| `.branches.diffs[]` | per package the version on each branch, the worst production severity, and `fixedOn` — branches that already carry the fix |
| top-level `generatedAt` | scan time; Step 2 re-checks the live lockfile anyway |

The scope is every production finding with `severity == "critical"`, grouped
by package. No critical on production means this is not a hotfix: say so,
show the development tier, and stop.

**Target version per package.** The lowest version in the same major that
fixes every advisory the scanner lists for that package (`fixedIn` is per
advisory). When development already runs a version of the same major that is
at least that high — `branches.diffs[].versions.development` — take
development's version: it has been through CI there, and the back-merge then
does not conflict on that package. One exception, decided in Step 3: when
development's version is on a later minor than the lowest fix and the risk
analysis rates that extra range High, take the lowest fix and say why in the
plan. CI on development proves the build, not the request behaviour. The
later minor reaches production with the next regular release, which carries
its own analysis, and the back-merge keeps development's higher version
(Step 8).

## Step 2 — Verify against the live lockfile and the history

- `git show origin/<production>:package-lock.json` still has the vulnerable
  version. When someone already fixed it, stop and say so: the next scan will
  catch up.
- Read the package's history as `skills/npm-maintenance/SKILL.md` §1 step 5
  prescribes. A reverted bump of the same package is a hard stop until its
  reason is known.
- Packages released in lockstep move together: `@next/*` and
  `eslint-config-next` with `next`, `@payloadcms/*` with `payload`, and the
  like. Name them in the plan.
- The fix is a major, or there is no fix (`fixedIn` empty) → stop. A major
  goes through the researched path of `skills/npm-maintenance/SKILL.md` §3; a
  missing fix needs a mitigation decision from a human.
- The package owns the database schema (Payload, Prisma, Drizzle) → the bump
  can need a migration. Stop and ask: generating a migration is the user's
  step, and a hotfix with a migration is their call.

## Step 3 — Plan, then one go

Read the project before planning:

- **Merge settings**:
  `glab api "projects/<enc-path>" | jq '{merge_method, squash_option, only_allow_merge_if_pipeline_succeeds, remove_source_branch_after_merge}'`.
- **Long-lived branches**: which of `acceptance` and `development` exist
  (`git ls-remote --heads origin`); missing ones are skipped.
- **Hotfix runbook**: `docs/release-process.md`, or whatever `CONVENTIONS.md`
  points to. It decides version bump, changelog section, tag, release,
  deploy windows and how a deploy is verified. Without a runbook: add a
  `Security` line to `CHANGELOG.md` when the project keeps one, and no
  version, tag or release — say so in the recap.
- **Slack channel**: always `#merge_requests` (`C050SLLPVFU`), the
  Greenberry-wide channel where every MR is announced for review. Do not ask
  and do not use a project channel: the thread is about an MR, and reviewers
  watch that one channel.
- **Maintenance ticket**: the tracker's ticket for the current quarter, found
  the way `skills/npm-maintenance/references/maintenance-ticket.md`
  describes. The hotfix gets its own subtask under it. The regular
  maintenance that follows is a separate MR and gets a separate subtask. No
  ticket for the quarter → ask; never create the parent.

**Risk.** Run the analysis in `skills/npm-maintenance/references/risk-analysis.md`
over the range from production's version to the target. A hotfix never waits
on the verdict: the critical is running on production now. The verdict does
shape the plan:

- When development's version and the lowest fix sit on different minors,
  analyse both ranges. The target version rule in Step 1 picks between them.
- **High**: run the measurement from `skills/npm-maintenance/SKILL.md`
  ("Behavioural changes need a measurement") when it fits the 24–72 hour
  window, and put the numbers in the plan. When it does not fit, the plan says
  "not measured", and the go accepts that knowingly. The MR stays ready, not
  Draft, because auto-merge needs a ready MR. The verdict travels in the plan,
  the MR description and the Slack parent instead.
- Every verdict carries "watch after deploy" and "rollback". The live reply
  in Step 6 names the metric to watch.

**Back-merge route.** Production must become an ancestor of acceptance and
development again, or the next release cannot fast-forward and re-conflicts
on every later release. A squashed MR copies the change but not the commit,
so it never restores that:

| `squash_option` | Route |
| --- | --- |
| `always` | **Push.** Fast-forward when the branch has nothing of its own; otherwise a merge commit with both parents, pushed. |
| `never`, `default_off`, `default_on` | **MR with auto-merge**, squash off: a `backmerge/<production>-into-<branch>-<version>` branch cut from the target, containing the merge commit, so it fast-forwards under any `merge_method`. |

The push route is the one deliberate exception to "never push to a protected
long-lived branch" in `rules/git-flow.md`: it carries a commit that was
already reviewed and merged, plus conflict resolution limited to the files
Step 8 allows. When the target branch does not allow Developer pushes, the
push route is unavailable: stop before Step 4 and report it.

Then show one plan block and ask for the go with `AskUserQuestion`:

```
Project       greenberrynl/<client>/<site> · production branch main
Critical      next 16.3.0 → 16.3.8 (GHSA-2xp9-…, GHSA-p293-…, GHSA-vcvr-…); with it @next/third-parties
Risk          Low — patch range, no runtime-relevant change used here, 16.3.8 is 12 d old · watch Function Invocations 1 h
Branch        hotfix/deps-next-16.3.8 in ~/.worktrees/<repo>-hotfix-next
MR            fix(deps): bump next to 16.3.8 for three critical RCE advisories → main, auto-merge armed
Version       1.1.3 + CHANGELOG [1.1.3] Security, tag v1.1.3, GitLab Release (per docs/release-process.md)
Back-merge    acceptance: fast-forward push · development: merge commit push (squash_option always)
Verified      type-check 0 · tests green · production build green (scratch DB, production schema)
Slack         #merge_requests — parent message below, thread replies on merge, live, failure
Jira          new subtask under RFW-319 (onderhoud Q4-2026); the parent stays untouched
Not in scope  33 high / 16 moderate on development → npm-maintenance
```

Include the draft parent message. No go, nothing leaves the machine.

## Step 4 — Build the hotfix

- Worktree from the production branch:
  `git worktree add -b hotfix/deps-<package>-<version> ~/.worktrees/<repo>-hotfix-<slug> origin/<production>`.
  The change *is* the dependency tree, so a symlinked `node_modules` cannot
  work: clone the main checkout's tree copy-on-write (`cp -Rc`) and let the
  package manager reconcile it, per the worktree rules in `CLAUDE.md`. Copy the
  env files the build needs; they leave with the worktree. Run the package
  manager through the Node version the project pins (see
  `skills/npm-maintenance/SKILL.md` §1). Inside the sandbox the user's npm
  cache is read-only (`EPERM` under `~/.npm/_cacache`): run the install
  outside the sandbox, or pass `--cache <scratch dir>`; never `sudo chown`.
- Direct dependency: install the **exact** target version —
  `npm install next@16.3.8`, never `next@^16.3.8`. A range resolves to the
  newest matching release: on the first run `^16.3.8` installed a 16.4.0
  published that week, a framework minor nobody had tested. npm still saves
  the caret in `package.json`. Transitive: `npm update <package>` when the
  parents' ranges allow it; otherwise an `overrides` entry pinned to the
  target, and the MR says when it can go.
- Never hand-edit a lockfile; never `--force`, `--legacy-peer-deps` or
  `--ignore-scripts`. Read the lockfile diff per entry, not per line: only the
  intended packages and their own dependencies may change version. An
  unexpected major elsewhere stops the run. Flag-only changes (`dev: true`
  dropped on optional platform binaries, a nested optional peer removed) are
  the bumped package's new graph when development's lockfile, which already
  runs that version, shows the same flags — check it there.
- Version, changelog, tag preparation as the runbook says. The changelog line
  states the outcome for a reader who did not see the MR: "Next.js 16.3.0 →
  16.3.8: closes three remote-code-execution advisories".
- Validate with the project's own scripts, each on its own, reading exit
  codes: lint, type-check, tests, and the **production build** — this goes
  straight to production. Then `npm ls <package>` shows only fixed versions;
  when `osv-scanner` is installed (the scanner's engine), scan the lockfile
  with it and expect no critical.
- **The build prerenders against the local database.** That database usually
  carries the schema of whatever branch the developer works on, not
  production's, and the build then dies on `column … does not exist` — an
  environment mismatch, not the bump. Build against a scratch database
  instead: `createdb` a new one in the local Postgres container, point only
  the worktree's copied env file at it (rewrite the database name with a
  small script so the URL, which carries the password, is never printed),
  run the project's migrate command — the production branch's migrations —
  and build. The developer's own database stays untouched. Drop the scratch
  database at cleanup.
- Check whether CI builds at all (the job list of the production branch's
  last pipeline). When it does not, the hosting platform's build on
  production is the first real build: say so in the MR, and the deploy
  read-back in Step 7 is not optional.

## Step 5 — Open the MR and arm auto-merge

- Create the hotfix subtask under the quarter's maintenance ticket first, so
  the MR carries its key from the start and the GitLab–Jira integration
  closes it on merge (`skills/npm-maintenance/references/maintenance-ticket.md`).
- Commit `fix(deps): bump <package> to <version>`, push, open the MR against
  the production branch with the mechanics of `skills/create-pr/SKILL.md`
  (conventional title, `ai:agent-authored` label, no `--reviewer`: a human
  picks the reviewer, and the Slack message asks for one). Title and
  description follow the project's ticket convention with the subtask key —
  in RefugeeWork `RFW-325: fix(deps): …` and `Closes RFW-325` on the first
  line. Description: the advisories with links, versions before and after,
  the scanner job, the risk-analysis block (Step 3), what was validated, the
  back-merge plan, deploy notes. Then add the MR as a remote link on the
  subtask.
- Arm auto-merge on the reviewed head only:

  ```sh
  glab mr merge <iid> -R <group/path> --auto-merge --remove-source-branch --sha <head-sha> --yes
  ```

  Confirm with `glab api "projects/<enc-path>/merge_requests/<iid>" | jq '{merge_when_pipeline_succeeds, detailed_merge_status}'`.
  Report what the API says, not what the command was meant to do.
- When the runbook names a no-deploy window (nightly jobs, for example) and
  the merge could land in it, arm auto-merge after the window instead.

## Step 6 — Slack

Post with the Slack connector in `#merge_requests` (`C050SLLPVFU`). Match the
channel: every post there is one short line followed by the MR link, in the
team's language — read its last few messages first.

- **Parent message**, right after the MR exists, one line: a critical marker,
  project, package and target version, how many critical advisories, that
  auto-merge is on and one approval is needed, then the MR link. Example:
  `:rotating_light: Critical hotfix RFW: next 16.3.8 (3 critical RCE-advisories op prod), auto-merge staat aan, 1 approval nodig <MR link>`.
  When the risk verdict is High, add it with its reason in a few words
  (`· risico hoog: prefetch-gedrag 16.3, kostenvlak Vercel`). The reviewer
  should know before approving.
  Keep its `ts`; every later post is a reply in that thread, and the thread
  link goes into the MR description so a resumed run finds it.
- **Thread replies on transitions only**: pipeline failed (job name),
  merged and deploying, live on production (version, tag, and the metric to
  watch from the risk block), back-merged, blocked (conflict, failed deploy).
  One or two lines each.
- No connector available: put the drafts in the recap, marked undelivered.

## Step 7 — Monitor

Three bounded loops, each with the `Monitor` tool, polling `glab api` every
60 s and emitting one line per transition. The scripts are in
`references/monitor-loops.md` (read it before arming the first loop).

1. **Hotfix MR** until `merged` or `closed`: `detailed_merge_status` and
   head-pipeline transitions. A Monitor expires after 30 minutes: re-arm while
   the MR is open. When the session ends, GitLab's auto-merge still merges
   server-side, and the next invocation resumes at Step 0.
2. **Production pipeline** of the squash commit until it is terminal. Read the
   deploy job's log, not only its status, then confirm on the platform the way
   the runbook says (a hook job can be green while the host refused the
   build — see Step 5 of `skills/mr-merged/SKILL.md`). The platform check is
   a bounded until-loop in Bash `run_in_background`, not a Monitor: platform
   CLIs usually need the sandbox off, which a Monitor cannot do.
3. **Back-merge pipelines** (Step 8), lighter: status only.

On each event, tell the user in one line, and send a push notification for
merged, live, and any failure. A failed pipeline or deploy stops the run at
that point: report the failing job, post it in the thread, fix nothing on
your own.

## Step 8 — Back-merge

Push after production deployed, and after the tag and release when the
runbook asks for them. Prepare before that: while production builds, run the
merge-tree check and, when it conflicts, build the merge commit in a worktree
on the target branch (point 4), committed but not pushed. Right before the
push, `git fetch` and confirm the target's head is still the merge commit's
first parent; when it moved, redo the merge. Pre-push hooks test the local
working tree, not the pushed ref, so tag and back-merge pushes skip them
(`--no-verify`); the target branch's CI runs on what was pushed.

For acceptance, then development (each that exists):

1. `git fetch origin`. Already contains production
   (`git merge-base --is-ancestor origin/<production> origin/<branch>`) → skip.
2. **Push route**:
   - the branch has nothing of its own
     (`git merge-base --is-ancestor origin/<branch> origin/<production>`):
     `git push --no-verify origin origin/<production>:<branch>`;
   - otherwise
     `git merge-tree --write-tree --name-only origin/<branch> origin/<production>`.
     Exit 0 prints the tree id:
     `git commit-tree <tree> -p origin/<branch> -p origin/<production> -m "Merge branch '<production>' into <branch>"`,
     then `git push --no-verify origin <sha>:<branch>`.
3. **MR route**: cut `backmerge/<production>-into-<branch>-<version>` from
   `origin/<branch>`, `git merge --no-ff origin/<production>`, push, open the
   MR with `"squash": false`, arm auto-merge, watch it like loop 1.
4. **Conflicts** (merge-tree exit 1, or `git merge` stops). Resolve in a
   worktree on the target branch, and only these files:
   - `package.json`: per dependency the higher version wins (a branch already
     ahead keeps its own); `version` takes production's.
   - lockfile: take the target branch's side, then regenerate it with the
     package manager (`npm install --package-lock-only`). Never merge a
     lockfile by hand.
   - `CHANGELOG.md`: the hotfix section sits below `## [Unreleased]`; delete
     from `[Unreleased]` any line the hotfix already shipped.

   Then compare the resolved tree with the target:
   `git diff --cached --stat origin/<branch>`. When only the version and the
   changelog differ — the usual case when the target already ran the fixed
   versions — the tree's code and dependencies equal what the target's CI
   already tested, and that diff is the check. Otherwise run `npm ci`,
   type-check and tests. Commit the merge with the message
   `Merge branch '<production>' into <branch>` (git's default names the
   remote-tracking ref and the local branch), then push or open the MR.
   A conflict in any other path stops the back-merge for that branch:
   report the paths, post "back-merge into <branch> needs a human" in the
   thread, and leave the branch untouched.
5. Verify: `git merge-base --is-ancestor origin/<production> origin/<branch>`
   holds for every long-lived branch.

A push to acceptance deploys acceptance. That is intended: it now runs what
production runs.

## Step 9 — Verify, report, clean up

- `git show origin/<production>:package-lock.json` carries the fixed versions
  for every critical in scope. Do not trigger a scanner run by hand: it posts
  to Slack, and its `report.json` becomes the baseline that decides what the
  next run flags as new. The next scheduled scan confirms the tier change.
- Final thread reply: live on production with the version, back-merged, and
  what stays for regular maintenance.
- Clean up as one batch (covered by the go):
  1. `TaskStop` every Monitor of this run.
  2. Each worktree: `git -C <path> status --short` must be clean (never remove
     local work — report it), then `git worktree remove --force <path>`; the
     copied env files go with it.
  3. Local hotfix and back-merge branches: prove them merged the way Step 5 of
     `skills/mr-merged/SKILL.md` describes for a squash merge, then
     `git branch -D`. Delete a remote source branch that survived the merge.
  4. The scratch database from Step 4 (`dropdb` in the same container) and
     the scratch report files. A local `next build` can leave orphaned
     `jest-worker/processChild.js` processes (parent pid 1) that keep the
     scratch database's connections open, so `dropdb` refuses with "being
     accessed by other users". List them by the worktree path and report the
     exact PIDs and commands; stopping them is the user's call, not part of
     the go. `dropdb --force` closes only the connections to that scratch
     database and is enough to drop it.
  5. Verify the worktree entries and local branches are gone.
- Run needed intervention (corrections, re-steering, a workaround) → hand off
  to `skills/improve-skill/SKILL.md` before closing out.

## Recap

| | |
| --- | --- |
| Critical(s) | package, versions, advisory ids |
| Hotfix MR | link, merged at, squash sha |
| Deploy | production pipeline + platform read-back, or ⚠️ with the quoted response |
| Version | tag and release links, or "no runbook — none" |
| Back-merge | per branch: fast-forward / merge commit / MR link, ancestor check ✅ |
| Slack | thread link, or drafts marked undelivered |
| Jira | parent key (untouched), subtask key and status, plus any automation move of the parent |
| Cleanup | monitors, worktrees, branches |
| Risk | verdict per package, measurement numbers or "not measured", the metric to watch and its first reading when available |
| Not in scope | what remains for `skills/npm-maintenance`, with the development tier |

## Constraints

- Criticals on the production branch only; one project per run.
- No major versions, no migrations, no source-code conflict resolution inside
  a hotfix.
- The hotfix MR always gets a human approval; auto-merge only removes the
  wait after it.
- In the tracker, only the hotfix's own subtask is created or updated. The
  quarterly maintenance ticket stays under human control.
- The back-merge push route exists because squash would break the ancestry;
  it is never used for new changes.
- Session-scoped loops: GitLab's auto-merge survives the session, the
  Monitors do not. Say so when the user expects the run to continue after
  they close the laptop, and resume on the next invocation.
