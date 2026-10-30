#!/usr/bin/env bash
# Builds the checkout this case runs in: a Demo Shop repository with no backlog
# items yet, and a fake jira whose three tickets go to Thursday's refinement:
# story DEMO-201 under epic DEMO-200 with every section filled, the placeholder
# story DEMO-202 outside any epic, and bug DEMO-203. The tickets live in
# .git/fixture/issues; every call to the fake is logged to
# .git/fixture/calls.log (inspect with --keep-temp).
#
# Run with --scaffold --allow-tools Bash; on macOS with Homebrew git, because
# the eval sandbox cannot run Apple's /usr/bin/git, an xcrun launcher.
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
WS=$PWD
FIX=$WS/.git/fixture

git init -q -b main
git config user.name "Demo Developer"
git config user.email "dev@demo-shop.example"
git config commit.gpgsign false

mkdir -p src/components src/lib "src/app/account"
printf '{\n  "name": "demo-shop",\n  "private": true\n}\n' > package.json
printf '# Demo Shop\n\nStorefront. Run `npm run dev` to start.\n' > README.md
cat > src/components/ProductCard.tsx <<'EOF'
interface ProductCardProps {
  name: string;
  price: number;
}

export function ProductCard({ name, price }: ProductCardProps) {
  return (
    <article>
      <h2>{name}</h2>
      <p>{price}</p>
    </article>
  );
}
EOF
cat > src/app/account/page.tsx <<'EOF'
export default function AccountPage() {
  return <h1>My account</h1>;
}
EOF
cat > src/lib/cart.ts <<'EOF'
export interface CartLine {
  price: number;
  quantity: number;
}

export function cartTotal(lines: CartLine[], discountPercent = 0) {
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return total * (1 - discountPercent / 100);
}
EOF
git add -A
git commit -q -m "chore: initial storefront"

mkdir -p "$FIX/bin" "$FIX/issues"
cp "$HERE/bin/jira" "$FIX/bin/"
cp "$HERE/issues/"* "$FIX/issues/"
chmod +x "$FIX/bin/"*

# zsh reads .zshenv in every shell, Claude Code's Bash tool included; it never
# reads .zshrc there.
printf 'export PATH="%s/bin:$PATH"\n' "$FIX" >> "$HOME/.zshenv"
