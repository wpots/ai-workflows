- When the pinned-install hook denies an install because it uses the wrong
  package manager, it now suggests the project's own manager. Before, its
  suggestion kept the wrong one.
  - In a pnpm project:
    - `npm ci` → `pnpm install --frozen-lockfile`;
    - `npm install <pkg>` → `pnpm add <pkg>`;
    - `npm uninstall` → `pnpm remove`.
  - In an npm project:
    - `pnpm install --frozen-lockfile` → `npm ci`;
    - `pnpm add` → `npm install`.
  - The suggestion runs on the pinned runtime, through `fnm exec` or the nvm
    path.
  - A command without a direct counterpart, such as `npm audit fix`, gets
    "Run the pnpm equivalent of this command" instead of a guess.
