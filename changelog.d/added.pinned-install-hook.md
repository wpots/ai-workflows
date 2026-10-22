- Plugin hook `scripts/require_pinned_install_runtime.py` (PreToolUse, Bash)
  enforces the ambient rule "Node and npm: the version the project pins": an
  `npm`/`pnpm` install whose Node or npm differs from the project's pin is
  denied, and so are npm in a pnpm project (or the reverse) and flags that
  switch the engine check off. The deny names the command on the pinned nvm
  install, or asks for `nvm install <pin>` when that Node is missing. Global
  installs, pnpm's own version and unpinned projects pass. Tests in
  `scripts/test_pinned_install_runtime.py`, run by
  `scripts/validate-ai-instructions.sh`.
  <!-- slack: Node/npm | Een install op een andere Node of npm dan de pin wordt geblokkeerd, met het juiste commando -->
