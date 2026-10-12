- The project `verify` skill told Claude to save UI screenshots in the system
  temp directory, which the Playwright MCP refuses: it writes only inside the
  project and its own `.playwright-mcp/` folder. The live check of MR !165
  ended in a `mv` out of the repository that only `auto` mode let through.
  The template now takes screenshots without a file name and reports the path
  the browser tool printed, or `inline`; `scripts/sync.sh --project` appends
  `.playwright-mcp/` to the project's `.gitignore` once. A project that already
  has `.claude/skills/verify/SKILL.md` keeps the old text: delete the file (or
  replace step 2.3 by hand when the project edited it) and re-sync.
