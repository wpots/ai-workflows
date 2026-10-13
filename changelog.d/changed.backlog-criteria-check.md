- `backlog` checks that an item's acceptance criteria can all hold before the
  item is marked `ready`: it runs criteria that search the tree and names the
  hits that stay, and reads criteria against each other and `Out of Scope`. An
  item that fails the check stays `draft`. Skill body only: no description,
  routing or digest change.
