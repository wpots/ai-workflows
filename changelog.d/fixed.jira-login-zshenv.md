- `service-cli`, `new-device-setup`: `JIRA_LOGIN` goes in `~/.zshenv`, not
  the shell profile. Agents run non-interactive `zsh -c`, which skips
  `~/.zshrc`, so a login set there never reached them and every `jira` call
  failed with "The tool needs a Jira API token" although the token was in the
  keychain.
  <!-- slack: Jira CLI | Zet JIRA_LOGIN in ~/.zshenv in plaats van ~/.zshrc, anders ziet een agent je login niet -->
