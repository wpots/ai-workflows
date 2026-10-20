- Release announcements: `announce_release` posts in the dedicated Slack
  channel `#ai-workflows` instead of `#development`, which was getting several
  release posts a week. The channel is set by the `SLACK_WEBHOOK_URL` CI/CD
  variable; the docs, the `upstream-rules` skill and the script messages now
  name the new channel, and `keep-current.md` tells developers to join it.
  <!-- slack: Release-posts | Staan voortaan hier in #ai-workflows in plaats van in #development -->
