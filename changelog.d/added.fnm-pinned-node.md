- fnm is supported next to nvm for running a project's pinned Node.
  - **The rule.** "Node and npm: the version the project pins" in `CLAUDE.md`
    now tells agents with fnm to run `fnm exec --using=.nvmrc <npm|pnpm|node> …`
    from the project root, instead of the absolute nvm path.
  - **The install hook** (`scripts/require_pinned_install_runtime.py`) changes
    in three ways:
    - it now judges an install run through `fnm exec` on the Node that fnm
      selects; before, it let such a command through unchecked;
    - when fnm has the pinned Node, a denied install names
      `fnm exec --using=…`;
    - when the pin is missing, it asks for `fnm install <pin>`.
  - **The allowlist.** `templates/project-claude-settings.json` allows the
    `--using=.nvmrc` form of the npm, pnpm and node commands it already allowed.
    New projects get these rules; an existing project's `.claude/settings.json`
    has to add them by hand.
  <!-- slack: Node-pin | agents en de install-hook werken nu ook met fnm (`fnm exec --using=.nvmrc …`) naast nvm -->
