- `rules/stacks/nextjs-payload.md` § Read Path: a CMS block that renders
  server data is a server section, an async Server Component per block type in
  the route's `_sections/` that runs the block's loader and renders its module.
  The route hands the template one section per data block, keyed by block id
  and each in its own `<Suspense>`; the template places `sections[block.id]`
  and never receives loaded items. Live preview gets the sections as
  `ReactNode` props and follows the autosave, and a redirect or `notFound()`
  that needs a block's data runs in the route, before the sections, so it
  keeps its status code. `rules/payload.md` § Editor-Facing Sections, the
  Definition of Done and the backlog's Definition of Ready check for it.
  <!-- slack: Data-blocks laden en renderen zichzelf in een eigen server section; de template plaatst alleen sections[id] -->
