// Rebuilds the fictional Demo Shop project for skill-demo recordings:
//   ~/.worktrees/demo-shop             the working copy
//   ~/.worktrees/demo-shop-origin.git  its "origin" (a local bare repo)
// from ./fixtures, with a dated history that matches the fake Jira in
// ./demo-jira-data.cjs, and the ai-workflows project files synced from this
// checkout. A rebuild also resets the fake CLIs' state, which lives in the
// working copy's .git folder.
// Run from anywhere: node .claude/skills/record-skill-demo/kit/build-demo-shop.mjs
// Afterwards: npm install --prefix ~/.worktrees/demo-shop --no-package-lock
// DEMO_SHOP=<name> builds ~/.worktrees/<name> instead (the name must start with
// "demo-shop"); the fake CLIs read the same variable.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WORKTREES = path.join(os.homedir(), ".worktrees");
const NAME = process.env.DEMO_SHOP || "demo-shop";
const REPO = path.join(WORKTREES, NAME);
const ORIGIN = path.join(WORKTREES, `${NAME}-origin.git`);
const FIXTURES = path.join(HERE, "fixtures");

const W = { name: "Wieteke Pots", email: "wieteke.pots@greenberry.nl" };
const ROBIN = { name: "Robin Jansen", email: "robin.jansen@demo-shop.example" };
const NOOR = { name: "Noor Bakker", email: "noor.bakker@demo-shop.example" };

const baseEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !k.startsWith("GIT_")),
);

const AI_WORKFLOWS = execFileSync("git", ["-C", HERE, "rev-parse", "--show-toplevel"], { env: baseEnv }).toString().trim();
const SYNC = path.join(AI_WORKFLOWS, "scripts", "sync.sh");

function git(args, who = W, date = undefined) {
  const env = {
    ...baseEnv,
    GIT_AUTHOR_NAME: who.name,
    GIT_AUTHOR_EMAIL: who.email,
    GIT_COMMITTER_NAME: W.name,
    GIT_COMMITTER_EMAIL: W.email,
  };
  if (date) {
    env.GIT_AUTHOR_DATE = date;
    env.GIT_COMMITTER_DATE = date;
  }
  return execFileSync("git", ["-C", REPO, ...args], { env, stdio: ["ignore", "pipe", "pipe"] }).toString();
}

function copyFixture(name) {
  fs.cpSync(path.join(FIXTURES, name), REPO, { recursive: true });
}

function commitAll(message, who, date) {
  git(["add", "-A"]);
  git(["commit", "-q", "-m", message], who, date);
}

function feature({ branch, fixture, message, who, date, mergeDate, title }) {
  git(["switch", "-q", "-c", branch, "development"]);
  copyFixture(fixture);
  commitAll(message, who, date);
  git(["switch", "-q", "development"]);
  if (mergeDate) {
    git(["merge", "-q", "--no-ff", branch, "-m", `Merge branch '${branch}' into 'development'\n\n${title}`], W, mergeDate);
    git(["branch", "-q", "-d", branch]);
  }
}

// ---------- reset ----------

for (const dir of [REPO, ORIGIN]) {
  if (!path.basename(dir).startsWith("demo-shop") || path.dirname(dir) !== WORKTREES) {
    throw new Error(`refusing to remove ${dir}`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
fs.mkdirSync(REPO, { recursive: true });
execFileSync("git", ["init", "-q", "--bare", "-b", "main", ORIGIN], { env: baseEnv });
execFileSync("git", ["init", "-q", "-b", "main", REPO], { env: baseEnv });
git(["config", "user.name", W.name]);
git(["config", "user.email", W.email]);
git(["remote", "add", "origin", ORIGIN]);

// ---------- history ----------

copyFixture("00-scaffold");
commitAll("chore: scaffold Demo Shop", W, "2026-08-24T10:00:00+0200");

execFileSync("bash", [SYNC, "--project", REPO], { env: baseEnv, stdio: ["ignore", "pipe", "pipe"] });
commitAll("chore: apply ai-workflows", W, "2026-08-24T11:00:00+0200");

git(["branch", "development"]);
git(["switch", "-q", "development"]);

// Sprint 15: 21 Sep – 2 Oct
feature({ branch: "feature/DEMO-120-voorraadstatus", fixture: "10-DEMO-120", message: "feat(product): voorraadstatus op de productpagina (DEMO-120)", who: W, date: "2026-09-23T14:10:00+0200", mergeDate: "2026-09-24T09:30:00+0200", title: "Productpagina toont voorraadstatus (DEMO-120)" });
feature({ branch: "fix/DEMO-122-winkelwagen-teller", fixture: "12-DEMO-122", message: "fix(cart): teller telt aantallen, niet regels (DEMO-122)", who: W, date: "2026-09-25T11:20:00+0200", mergeDate: "2026-09-25T15:05:00+0200", title: "Winkelwagen telt verkeerd na verwijderen (DEMO-122)" });
feature({ branch: "feature/DEMO-121-zoeken", fixture: "11-DEMO-121", message: "feat(search): zoeken op productnaam (DEMO-121)", who: ROBIN, date: "2026-09-28T16:40:00+0200", mergeDate: "2026-09-29T10:15:00+0200", title: "Zoeken op productnaam (DEMO-121)" });
feature({ branch: "chore/DEMO-123-next-16", fixture: "13-DEMO-123", message: "chore(deps): upgrade naar Next.js 16 (DEMO-123)", who: NOOR, date: "2026-09-30T10:00:00+0200", mergeDate: "2026-09-30T13:45:00+0200", title: "Upgrade naar Next.js 16 (DEMO-123)" });

copyFixture("19-close-15");
commitAll("docs: sprint 15 afgesloten", W, "2026-10-02T15:30:00+0200");

git(["switch", "-q", "main"]);
git(["merge", "-q", "--no-ff", "development", "-m", "Merge branch 'development' into 'main'\n\nRelease 1.4.0: sprint 15"], W, "2026-10-02T16:00:00+0200");
git(["tag", "-a", "v1.4.0", "-m", "Release 1.4.0"], W, "2026-10-02T16:00:00+0200");
git(["switch", "-q", "development"]);

// Sprint 16: 5 – 16 Oct
copyFixture("20-plan-16");
commitAll("docs: sprint 16 gepland", W, "2026-10-05T10:30:00+0200");

feature({ branch: "fix/DEMO-133-alt-teksten", fixture: "21-DEMO-133", message: "fix(category): alt-tekst op productafbeeldingen (DEMO-133)", who: NOOR, date: "2026-10-06T15:00:00+0200", mergeDate: "2026-10-07T09:40:00+0200", title: "Afbeeldingen zonder alt-tekst op de categoriepagina (DEMO-133)" });
feature({ branch: "feature/DEMO-131-prijzen-nl", fixture: "23-DEMO-131", message: "fix(price): prijzen in Nederlandse notatie (DEMO-131)", who: W, date: "2026-10-06T16:20:00+0200", mergeDate: "2026-10-07T11:00:00+0200", title: "Prijzen in Nederlandse notatie (DEMO-131)" });
feature({ branch: "feature/DEMO-130-checkout-overzicht", fixture: "22-DEMO-130", message: "feat(checkout): overzicht met btw per regel (DEMO-130)", who: W, date: "2026-10-08T17:00:00+0200", mergeDate: "2026-10-09T10:20:00+0200", title: "Checkout-overzicht met btw per regel (DEMO-130)" });

// Open work at the end of sprint 16
feature({ branch: "chore/DEMO-134-lighthouse", fixture: "24-DEMO-134", message: "perf(product): LCP-afbeelding met priority, reviews lazy (DEMO-134)", who: ROBIN, date: "2026-10-12T14:30:00+0200" });
feature({ branch: "fix/DEMO-142-bezorgkosten", fixture: "26-DEMO-142", message: "fix(checkout): bezorgkosten voor België (DEMO-142)", who: W, date: "2026-10-12T16:45:00+0200" });
feature({ branch: "feature/DEMO-132-kortingscode", fixture: "25-DEMO-132", message: "feat(cart): kortingscode invoeren in de winkelwagen (DEMO-132)", who: W, date: "2026-10-13T11:15:00+0200" });

execFileSync("git", ["-C", REPO, "push", "-q", "-u", "origin", "--all"], { env: baseEnv, stdio: ["ignore", "pipe", "pipe"] });
execFileSync("git", ["-C", REPO, "push", "-q", "origin", "--tags"], { env: baseEnv, stdio: ["ignore", "pipe", "pipe"] });

git(["switch", "-q", "feature/DEMO-132-kortingscode"]);

process.stdout.write(git(["log", "--oneline", "--graph", "--all", "-n", "40"]));
process.stdout.write(git(["status", "--short", "--branch"]));
