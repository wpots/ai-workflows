# Shared by every tape: the look, and Claude started off-screen in the
# fictional Demo Shop with the fake `jira` and `glab` first on PATH.
# Use: `Output …` first, then
#   Source .claude/skills/record-skill-demo/kit/tapes/_setup.tape
# Render from the root of ai-workflows, outside the sandbox.
# Recording a skill from an unreleased branch: replace `claude` below with
#   claude --plugin-dir <worktree of that branch>

Set Shell zsh
Set Width 1920
Set Height 1080
Set FontSize 22
Set Padding 36
Set Margin 48
Set MarginFill "#5801FF"
Set BorderRadius 14
Set WindowBar Colorful
Set Theme "Dracula"
Set TypingSpeed 55ms

Hide
Type "unset -m 'CLAUDE*' && export PATH=$PWD/.claude/skills/record-skill-demo/kit/bin:$PATH && cd ~/.worktrees/demo-shop && clear"
Enter
Type "claude"
Enter
Sleep 6s
Down
Sleep 300ms
Enter
Wait+Screen@30s /shift\+tab to cycle/
Sleep 1s
Ctrl+L
Sleep 1s
Show

Sleep 1.5s
