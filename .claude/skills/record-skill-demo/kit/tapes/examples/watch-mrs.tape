# watch-mrs watches MR !12 of the fictional demo-shop/webshop. The fake `glab`
# plays a timeline from its first call, about 70 s per phase: pipeline running
# → lint fails → Robin's review comment → new pipeline → success → approved
# and mergeable. `glab mr merge` refuses.
# Needs: a fresh build, which restarts the timeline.
# Rendered 2026-10-13: 9:26, shown at 4× (2:36, --keep 8.8).

Output docs/demo/recordings/watch-mrs.mp4
Source .claude/skills/record-skill-demo/kit/tapes/_setup.tape

Type "houd MR !12 van demo-shop/webshop in de gaten, interval 1 minuut, auto-merge uit"
Sleep 1.2s
Enter

# Setting up the loop
Wait+Screen@600s /· done |Esc to cancel/
# Then the loop reports what changes
Sleep 450s

Hide
Ctrl+C
Sleep 500ms
Ctrl+C
Sleep 1s
