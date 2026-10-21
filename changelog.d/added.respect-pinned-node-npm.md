- Ambient rule (Shell Usage › Node and npm): run `node`/`npm` through the
  version the project pins (`.nvmrc`, `.node-version`, Volta, `engines`) and
  its bundled npm unless `packageManager`/`engines.npm` names another, never
  nvm's default on `PATH`. When the pinned npm cannot do the job, move the pin
  in the same MR instead of writing the lockfile with an unpinned npm.
  <!-- slack: Node/npm | Claude draait node en npm voortaan via de versie uit .nvmrc, niet de nvm-default -->
