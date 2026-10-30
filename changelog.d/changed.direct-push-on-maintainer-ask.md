- The upstream MR rule (`upstream-mr.md`) has one exception: in `ai-workflows`,
  when the maintainer asks in the session for a change to go straight to `main`,
  the agent commits on `main` and pushes with `--no-verify` instead of opening a
  substitute MR, which spent runners and a round-trip for nothing.
  <!-- slack: upstream-mr | Vraagt de maintainer om een directe push naar main, dan pusht de agent zonder vervangende MR -->
