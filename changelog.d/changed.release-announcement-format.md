- The `#development` release post is Block Kit now: an overview of what to do,
  the update steps, a "Projecten syncen" block with the commands only when the
  release changed a file a project sync delivers, an "Eenmalig" block, and one
  table of the changes. A changelog entry gets a table row through a Dutch
  `<!-- slack: … -->` continuation line under its bullet; entries without one
  are counted under the table. `skills/upstream-rules` asks for that note when
  it writes a fragment, and `validate-skills.mjs` errors on a note that is not
  indented under its bullet.
  <!-- slack: release-post | Releasepost met kopjes en een tabel; sync-instructies alleen als je projecten moet syncen -->
- New fragment type `changelog.d/action.<slug>.md` for a step developers take
  once after updating. It lands under `### Action required` and in the post's
  "Eenmalig" block, and does not bump the version on its own.
  <!-- slack: changelog | Nieuw fragmenttype `action` voor eenmalige stappen na een update -->
