- `skills/release` Step 7: a ticket with a commit or merged MR in the release
  range gets the version (or the label fallback) whatever its status and
  whatever PO question is open; before, a partial ticket got nothing, so
  shipped tickets looked as if they were not in the release. A key carried only
  by an open MR is a new class, `open`: nothing written, reported with its MR.
  Done stays a separate go. The recap now says where the label shows and that
  Releases and the Fix Version field stay empty when the project has no Jira
  version.
