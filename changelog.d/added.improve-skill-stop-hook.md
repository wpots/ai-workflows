- A `Stop` hook (`scripts/improve_skill_retrospective.py`, registered in
  `hooks/hooks.json`) that turns the "run `improve-skill` after a run that needed
  intervention" rule into a prompt. After a Greenberry skill ran and the user
  stepped in — an interrupt, an explicit tool rejection, or typing right after a
  failed tool call that was the run's latest outcome — it blocks the stop once
  per session and asks Claude to offer the retrospective. It never runs
  `improve-skill` or edits a skill. It reads the transcript by entry structure,
  so notes that quote those phrases do not trigger it, and fails open on any
  error.
