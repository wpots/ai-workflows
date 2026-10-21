- `npm-maintenance`: the request measurement for a framework minor runs
  headless (`references/request-measurement.md`, Playwright from the project
  or `puppeteer-core` in the scratchpad, both driving the local Chrome) and
  gets a pass/fail idle check: a data request in the last 10 s of a 30 s idle
  window, or one URL fetched more than twice, keeps the MR in Draft. An
  unattended run can now carry the measurement out instead of leaving it to a
  human.
  <!-- slack: Onderhoud | Requestmeting bij een framework-minor draait headless, met een harde idle-check tegen prefetch-loops -->
