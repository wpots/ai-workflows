- `address-review-comments` now ends its hand-back with a reply in the Slack
  thread of the MR's channel post, next to the 👍 and the MR note. It mentions
  each reviewer with an open thread, says what changed and offers another look;
  one reply per push, skipped silently when the MR has no post or no Slack tool
  is available. Before, a push and a GitLab note left the reviewer without
  anything in the channel where the review talk happens.
  <!-- slack: address-review-comments | Na een push ook een reply in de Slack-thread, niet alleen een GitLab-notitie -->
