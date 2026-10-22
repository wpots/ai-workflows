# Template Delta (Check 2b) — Reference

How lane 0 of `skills/start-project` lists what the template changed since the
project's base. Read it before running check 2b.

A project made from `development` starts on a line that keeps moving.
trimbos-website took five template MRs in its first two days and kept four
more in a ports list it built by hand. This is the downstream counterpart of
the harvest in `skills/upstream-to-unicore`, whose Step 1 says how to read the
`owned` globs of `template.json` at `template.commit`.

## List the MRs

```bash
glab api "projects/greenberrynl%2Fthe-greenhouse%2Funicore-template/repository/commits/<template.commit>" | jq -r .committed_date
glab mr list -R greenberrynl/the-greenhouse/unicore-template --merged --target-branch development --per-page 100 --output json \
  | jq -r '.[] | select(.merged_at > "<committed_date>") | "!\(.iid) \(.merged_at[0:10]) \(.title)"'
glab mr list -R greenberrynl/the-greenhouse/unicore-template --target-branch development --per-page 100 --output json \
  | jq -r '.[] | "!\(.iid) draft:\(.draft) \(.title)"'
```

## Decide per MR

A merge close to the commit date can already be in the base, so decide per MR
from its changed files (`glab mr diff <iid> -R greenberrynl/the-greenhouse/unicore-template`)
against the project's copy of each file:

- **in the project** — the project has the change already
- **port** — a template-owned file the project still has in its old form. Name
  what to take, at the project's path: the setup moves preset folders, so a
  template path is not always the project path
- **not applicable** — a file only the template has, or a preset the project
  did not choose

## Record the ports

The ports go to `docs/todo/unicore-template-ports.md`: the base commit and the
date checked on top, then one row per MR (MR · change · what to take into the
project). An open MR is ported once it merges. A row goes when its port lands,
and the file goes when it is empty.

Each port lands as its own MR in the project, not inside the kickoff. An open
template MR that fixes a step of lane 1b explains that step's failure before
anyone debugs it, so name it in the lane 1b table.
