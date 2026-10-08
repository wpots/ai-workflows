- Browser verification now chooses tools by purpose: available native
  browser control for one-off UI checks, existing browser MCP as fallback,
  and the project test runner for reusable regression and CI. The policy
  lives in `rules/testing.md`; project adapters, the Copilot baseline and
  the global Claude adapter load it before browser work. Installed
  Playwright dependencies no longer imply a standalone script, and browser
  spot-checks explicitly complement required automated checks.
