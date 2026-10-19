- `start-project`: Lane 0 now checks the template for MRs and issues before
  Create from template. GitLab Import/Export copies them into the new project
  and advances its MR counter, which is how one project's first real MR became
  `!50`. A new row, 3a, reports MRs and issues that were already copied into an
  existing project.
  <!-- slack: start-project | Checkt vóór Create from template dat de template 0 MR's/issues heeft, zodat je eerste MR !1 is -->
- `upstream-to-unicore`: The lineage note now says what
  `project-templates/unicore-template` actually supplies: only the GitLab
  settings. The code is a clone of `the-greenhouse/unicore-template`, so
  `.unicore.json` always names a commit there. The note also forbids code
  maintenance, MRs and issues in the copy.
