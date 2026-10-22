- `skills/improve-skill` no longer asks for a check or an eval on top of every
  learning. The prose edit is the default.
  - A check is added only when the wrong text was in a skill, command or rule
    and could come back there.
  - An eval is added only when the skill's own text led the run the wrong way.
    It is kept only after it was seen failing on the base.
  - The `Stop` hook now offers to *check whether* anything from the run belongs
    in the skill, adding "often nothing does", instead of offering to fold what
    went wrong back.
  <!-- slack: improve-skill | voegt geen check of eval meer toe die zonder de fix niet kan falen -->
