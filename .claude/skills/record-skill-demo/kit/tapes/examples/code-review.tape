# code-review on the DEMO-132 branch (discount code) against development.
# The branch has planted faults: an inverted expiry check, a test that
# approves that fault, whole and half cents, an API key in the code, a div as
# a button, an input without a label, a speculative fallback.
# Needs: a fresh build (it ends on feature/DEMO-132-kortingscode) and
# npm install. Rendered 2026-10-13: 3:31, shown at 1×.

Output docs/demo/recordings/code-review.mp4
Source .claude/skills/record-skill-demo/kit/tapes/_setup.tape

Type "doe een code review van deze branch tegen development"
Sleep 1.2s
Enter

Wait+Screen@900s /· done |Esc to cancel/
Sleep 6s

Hide
Ctrl+C
Sleep 500ms
Ctrl+C
Sleep 1s
