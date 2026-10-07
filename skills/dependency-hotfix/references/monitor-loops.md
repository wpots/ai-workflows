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
— and then confirm on the platform the way the project's runbook says (for
Clever Cloud, `clever activity` shows the commit with state `OK`; a build
there finishes minutes after the job). A `manual` deploy job ends the loop:
triggering it is the user's call.

## Loop 3 — back-merge pipelines

The same script as loop 2 per branch, with `PROD` replaced by the back-merged
branch and `SHA` by the pushed commit (fast-forward: production's head; merge:
the `commit-tree` result). Status only — report it in the recap; a failure is
reported, not fixed.

For the MR route, watch each back-merge MR with loop 1 instead.
