# Monitor loops for a dependency hotfix

Each loop is a bash file in the session scratchpad, started with the `Monitor`
tool as `bash <scratch>/<file>.sh` and `timeout_ms: 1800000` (the maximum; re-arm
on expiry). Write the values in literally — no shell variables passed in from
outside, so the command matches the allowlist.

Rules that apply to all three:

- Run them with `bash` explicitly. Under zsh, `status` is a read-only variable
  and silently kills a loop that assigns it; these scripts avoid the name
  anyway.
- Every `glab api` call may fail transiently: `|| true` and an empty-output
  guard, so one hiccup does not end the watch.
- Emit only on change, and emit every terminal state — a loop that only prints
  success stays silent through a failure, and silence looks like "still
  running".
- `sha=` on the pipelines endpoint needs the full 40-character hash.

## Loop 1 — hotfix MR until merged or closed

Placeholders: `ENC` (URL-encoded project path), `IID`.

```bash
#!/usr/bin/env bash
prev=""
while true; do
  mr=$(glab api "projects/ENC/merge_requests/IID" 2>/dev/null || true)
  if [ -n "$mr" ]; then
    cur=$(jq -r '"\(.state) \(.detailed_merge_status) pipeline=\(.head_pipeline.status // "none")"' <<<"$mr")
    if [ "$cur" != "$prev" ]; then
      echo "MR !IID: $cur"
      prev=$cur
      pid=$(jq -r '.head_pipeline.id // empty' <<<"$mr")
      if [ "${cur##*pipeline=}" = "failed" ] && [ -n "$pid" ]; then
        glab api "projects/ENC/pipelines/$pid/jobs?scope[]=failed" 2>/dev/null \
          | jq -r '.[] | "  failed job: \(.stage)/\(.name) \(.web_url)"' || true
      fi
    fi
    case "$cur" in merged*|closed*) exit 0 ;; esac
  fi
  sleep 60
done
```

`detailed_merge_status` alone covers approval (`not_approved`), pipeline
(`ci_must_pass`, `ci_still_running`), conflicts and draft state. After
`merged`, read the commit that landed on production from the MR:
`jq -r '.merge_commit_sha // .squash_commit_sha // .sha'` — with
`merge_method: ff` plus squash there is no merge commit, so the squash commit
is the one.

## Loop 2 — production pipeline of the landed commit

Placeholders: `ENC`, `PROD` (production branch), `SHA` (full hash from loop 1).

```bash
#!/usr/bin/env bash
prev=""
while true; do
  p=$(glab api "projects/ENC/pipelines?ref=PROD&sha=SHA&per_page=1" 2>/dev/null \
    | jq -r '.[0] // empty | "\(.id) \(.status)"' || true)
  if [ -n "$p" ]; then
    id=${p%% *}
    state=${p#* }
    jobs=$(glab api "projects/ENC/pipelines/$id/jobs?per_page=100" 2>/dev/null \
      | jq -r '[.[] | select(.name | test("deploy"; "i")) | "\(.name)=\(.status)"] | sort | join(" ")' || true)
    cur="pipeline $id $state $jobs"
    if [ "$cur" != "$prev" ]; then
      echo "$cur"
      prev=$cur
    fi
    case "$state" in success|failed|canceled|skipped|manual) exit 0 ;; esac
  fi
  sleep 60
done
```

A green pipeline proves the job ran, not that the host built it. Read the
deploy job's log tail — `glab api "projects/ENC/jobs/<job-id>/trace" | tail -40`
— and then confirm on the platform the way the project's runbook says. A
`manual` deploy job ends the loop: triggering it is the user's call.

## Platform read-back — one notification, not a Monitor

The platform check needs one answer ("did this commit build?"), and platform
CLIs often cannot run inside the sandbox (`npx clever-tools` writes to the npm
cache). `Monitor` has no sandbox switch, so use a bounded until-loop with Bash
`run_in_background` and the sandbox off instead; it notifies once when it
exits. Clever Cloud example, placeholders `APP_ID` and `SHORT_SHA`:

```bash
#!/usr/bin/env bash
last=""
for _ in $(seq 1 40); do
  last=$(npx clever-tools activity --app APP_ID --format json 2>/dev/null \
    | jq -r '[.[] | select((.commit // "") | startswith("SHORT_SHA"))] | sort_by(.date) | last // empty | "\(.state) \(.action) \(.date)"' || true)
  case "$last" in
    OK*|FAIL*|CANCELLED*) echo "SHORT_SHA: $last"; exit 0 ;;
  esac
  sleep 30
done
echo "SHORT_SHA: no terminal state after 20 min (last: ${last:-none})"
exit 1
```

On the first run the production build reached `OK` about four minutes after
the deploy job. Run the same check for acceptance after its back-merge push,
since that push deploys acceptance.

## Loop 3 — back-merge pipelines

The same script as loop 2 per branch, with `PROD` replaced by the back-merged
branch and `SHA` by the pushed commit (fast-forward: production's head; merge:
the `commit-tree` result). Status only — report it in the recap; a failure is
reported, not fixed.
