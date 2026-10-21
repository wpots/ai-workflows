- `npm-maintenance` triages reachability from the advisory's own text, not its
  title or a scanner summary: list every condition it names (component and
  version, transitive included; platform; feature or config), check each
  against production with evidence, and give `reachable`, `not reachable` or
  `unknown`, where unknown counts as reachable. Only a person moves a critical
  from a hotfix to the next release. `dependency-hotfix` runs the same triage
  in Step 2 and puts the verdict per advisory in its plan.
  <!-- slack: Onderhoud | Bereikbaarheid van een lek uit de advisory zelf; onbekend telt als bereikbaar -->
