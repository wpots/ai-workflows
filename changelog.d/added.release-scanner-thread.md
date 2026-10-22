- `skills/release` Step 8c: when the latest dependency-scan post in Slack lists
  the project under *Fix now* or *Deploy to fix now*, the release replies once
  in that thread that the site is patched: it checks the version the tag ships
  against the scanner's fixed version first, names the packages and the live
  version, and says the next scan clears it. The Step 3 plan lists the reply,
  so the one go covers it, and the recap has a Scanner thread row.
- Eval `release-8`: the scanner thread after a release that fixes a listed
  critical.
