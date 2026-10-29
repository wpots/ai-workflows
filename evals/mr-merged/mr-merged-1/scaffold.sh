#!/usr/bin/env bash
# Builds the checkout this case runs in: a Demo Shop repository whose `origin`
# is a bare repository inside .git, with the fictional merge request 17 (ticket
# DEMO-150) squash-merged on main and the checkout still on its source branch.
# The deploy job of main's pipeline is green, but its log shows the Vercel hook
# refusing the deploy. The fake glab, jira and vercel in bin/ answer from the
# SHAs written to .git/fixture/env and log every call to .git/fixture/calls.log
# (inspect with --keep-temp).
#
# Run with --scaffold --allow-tools Bash; on macOS with Homebrew git, because
# the eval sandbox cannot run Apple's /usr/bin/git, an xcrun launcher.
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
WS=$PWD
FIX=$WS/.git/fixture
BRANCH=DEMO-150-newsletter-signup

git init -q -b main
git config user.name "Wieteke Pots"
git config user.email "wieteke.pots@example.com"
git config commit.gpgsign false

commit() { git add -A && git commit -q -m "$1"; }

mkdir -p src docs/backlog
printf '{\n  "name": "webshop",\n  "private": true\n}\n' > package.json
printf '# Webshop\n\nDemo Shop storefront.\n' > README.md
printf 'export function Footer() {\n  return null;\n}\n' > src/Footer.tsx
commit "chore: initial storefront"

git switch -q -c "$BRANCH"
cat > docs/backlog/feat-newsletter-signup.md <<'EOF'
# Feature: Newsletter Signup in the Footer

## Status

done

## Ticket

DEMO-150

## Summary

A visitor can leave an email address in the footer to get the newsletter.
EOF
printf 'export function NewsletterSignup() {\n  return null;\n}\n' > src/NewsletterSignup.tsx
commit "feat(footer): add the newsletter signup form"
printf 'import { NewsletterSignup } from "./NewsletterSignup";\n\nexport function Footer() {\n  return <NewsletterSignup />;\n}\n' > src/Footer.tsx
commit "feat(footer): show the signup in the footer"
SOURCE_SHA=$(git rev-parse HEAD)

git switch -q main
printf '# Webshop\n\nDemo Shop storefront. Run `npm run dev` to start.\n' > README.md
commit "docs: how to start the storefront"
git merge -q --squash "$BRANCH"
git commit -q -m "feat(footer): newsletter signup in the footer (DEMO-150)"
SQUASH_SHA=$(git rev-parse HEAD)

# GitLab deleted the source branch on merge, so origin only has main.
git init -q --bare .git/origin.git
git remote add origin "$WS/.git/origin.git"
git push -q origin main
git fetch -q origin
git switch -q "$BRANCH"

mkdir -p "$FIX/bin"
printf 'BRANCH=%s\nSOURCE_SHA=%s\nSQUASH_SHA=%s\n' "$BRANCH" "$SOURCE_SHA" "$SQUASH_SHA" > "$FIX/env"
cp "$HERE/bin/glab" "$HERE/bin/jira" "$HERE/bin/vercel" "$FIX/bin/"
chmod +x "$FIX/bin/"*

# zsh reads .zshenv in every shell, Claude Code's Bash tool included; it never
# reads .zshrc there. A bash login shell is untested.
printf 'export PATH="%s/bin:$PATH"\n' "$FIX" >> "$HOME/.zshenv"
