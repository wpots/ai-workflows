- The ready check runs where the path needs it. `backlog` ends every item it
  writes or updates with the check, `sprint-planning` offers it over the
  sprint's planned items after its review pause, and `work-backlog` reports each
  `draft` item's failing points and next step when nothing is eligible, without
  writing to the items.
- `sprint-planning` writes `Planned for Sprint <N>.` as a note under the status
  value instead of replacing it. A status that still reads
  `Planned for Sprint <N>.` is read as `draft` with that note, and the ready
  check rewrites it as value plus note the next time it writes the item.
- `refinement` prep adds the questions a developer parked in a BLI
  (`Blocked on: refinement — …`) to that ticket's question list; outcome mode
  names the decided ones so the developer can remove the line.
  <!-- slack: backlog | Ready check draait na schrijven, na planning en als de loop niks vindt -->
