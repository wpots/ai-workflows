- `start-project`: Lane 0 checks the template for MRs and issues before
  Create from template. GitLab Import/Export copies them into the new project
  and advances its MR counter, so the first real MR got `!50`. A new row (3a)
  reports MRs and issues that were copied into an existing project.
  `upstream-to-unicore` adds the rule behind it: never open an MR or issue in
  `project-templates/unicore-template`.
  <!-- slack: start-project | Checkt vóór Create from template dat de template 0 MR's/issues heeft, zodat je eerste MR !1 is -->
