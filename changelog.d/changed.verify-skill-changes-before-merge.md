- `improve-skill` says how to watch a skill edit fail and pass before merge:
  run the situation with `claude -p "<prompt>" --plugin-dir <checkout>` on the
  base and on the branch, since the checkout's plugin loads over the installed
  one. Skill body only: no description, routing or digest change.
