- Release cadence is enforced: the release MR opens as a draft and a Monday
  07:00 pipeline schedule (`release_ready`) marks it ready and requests
  review, so a week of merges ships as one version and one post. A fix
  someone is waiting on: mark the MR ready by hand and merge. Scheduled
  pipelines skip the other release jobs.
  <!-- slack: Releases | Release-MR blijft draft tot maandagochtend; daarna één versie en één post per week -->
