- `dependency-hotfix` back-merges production into acceptance and development
  by push under every `squash_option`, never by a `backmerge/*` MR: the MR
  route for `never`, `default_off` and `default_on` is gone from Step 3,
  Step 8, the plan block, the recap and `monitor-loops.md`, and
  `rules/git-flow.md` drops its `squash_option is always` condition. A project
  whose target branch refuses Developer pushes stops before Step 4 instead of
  falling back to an MR.
  <!-- slack: dependency-hotfix | Back-merge gaat altijd met een push, nooit met een MR, ongeacht squash_option -->
