- `skills/work-backlog` § Night pause in a loop: a self-paced `/loop` tick
  between 23:00 and 06:00 starts no work, and the loop resumes with one
  one-shot `CronCreate` after 06:00 instead of waking through the night. Each
  night tick on an expired prompt cache wrote the whole context again, which
  bills to usage credits once the plan's limit has run out.
- `skills/watch-mrs`: during the night pause the fallback heartbeat makes way
  for the same morning `CronCreate`; the 3600s night heartbeat woke the session
  on an expired cache every hour.
  <!-- slack: Loops slapen 's nachts: work-backlog en watch-mrs gaan na 06:00 verder met één cron -->
