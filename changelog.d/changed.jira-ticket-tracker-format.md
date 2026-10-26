- `jira-ticket`: a ticket carries no repo references — no file paths, line
  numbers, backlog file names, MR links or Touchpoints section. The product
  owner reads the ticket; the backlog item keeps the code pointers. Story and
  Task templates gain optional Open questions, mirroring the backlog items'
  `Blocked on:` lines, and Tech notes, for choices to confirm at refinement.
  <!-- slack: Jira-tickets | Geen repo-paden of MR-links meer in tickets; open vragen en tech notes krijgen een eigen kopje -->
- `jira-ticket`: follows an issue type's own Jira description template, which
  Jira prepends on create without the CLI showing it. After the first create of
  a type the skill checks the ticket and replaces the description, so the body
  no longer lands under an empty template.
- `jira-ticket`: reads the existing backlog items, untracked ones included,
  before it files a ticket, and takes the ticket language from
  `CONVENTIONS.md` instead of from a handful of existing tickets.
- `create-pr`: names only the delivered ticket by key. Through the GitLab–Jira
  integration every key in an MR or commit can move that ticket to In
  Progress, so a docs MR that listed ten keys moved ten tickets nobody had
  started.
  <!-- slack: create-pr | Noem in een MR alleen het ticket dat je oplevert; elke andere key zet dat ticket op In Progress -->
