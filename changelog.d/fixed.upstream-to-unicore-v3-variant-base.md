- `upstream-to-unicore`: the base estimate for a v3 project also looks at the
  CMS variant branches `development-payloadcms` and `development-prepr`, next
  to the tag `v3.0.0`, and names the ref the base came from. A Payload project
  started from its variant branch, whose commits are not on the tag, so the
  estimate against the tag alone picked the wrong base.
