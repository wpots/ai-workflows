- `maintenance` checks every critical in lane A against the production
  branch's lockfile and labels it on production, development only, or
  production not checked. A critical on production makes lane A `urgent`,
  stays off the proposed backlog list, and the verdicts end with one
  `Next step: /greenberry:dependency-hotfix for <package>, … (you)` line. The
  sweep only proposes the hotfix; it never starts it.
  <!-- slack: maintenance | Een critical die op productie draait wijst nu direct naar dependency-hotfix in plaats van de backlog -->
