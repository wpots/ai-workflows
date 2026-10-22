- `skills/maintenance` lane B flags a Node pin that trails a security release
  of its own major as a high finding, read from `nodejs.org/dist/index.json`
  (`"security": true`). A pin that agrees across `.nvmrc`, the CI image,
  hosting and `engines` never patches by itself, so the fix moves all four in
  one MR; in an npm project that MR also regenerates the lockfile with the npm
  of the new Node.
  <!-- slack: Maintenance | Een Node-pin die achterloopt op een security-release is nu een high finding -->
