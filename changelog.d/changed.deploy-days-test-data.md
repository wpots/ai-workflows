- `release` checks the day right before the promotion: production goes live
  Monday to Thursday, preferably Monday to Wednesday, never on a Friday or in
  the weekend. On those days it proposes Monday, and a promotion on an
  explicit go records the exception in the GitLab Release description.
  `dependency-hotfix` still ships a critical on those days, and its MR
  description records the exception with the day and the advisory.
  <!-- slack: release | Geen productie-deploy op vrijdag of in het weekend; een critical mag, en de uitzondering staat in de MR -->
- Evals `release-9` and `dependency-hotfix-7`: a release and a critical on a
  Friday, each recording the exception.
- `rules/testing.md` gets a Test Data section: synthetic data only in tests,
  fixtures, stories and seeds, and test secrets from the secret store, never
  from a committed file.
  <!-- slack: testing | Testdata is synthetisch; geen klant- of productiedata in tests, fixtures, stories of seeds -->
