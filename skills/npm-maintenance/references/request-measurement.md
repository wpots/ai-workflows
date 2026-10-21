# Request measurement

The method behind "Behavioural changes need a measurement" in
`skills/npm-maintenance/SKILL.md`. A headless browser counts the framework's
data requests on a page that sits idle after load. That gives two results:

- the **idle check**, a pass or a fail;
- the **volume**, compared with production as numbers.

It runs headless, so an unattended run can carry it out instead of leaving the
MR in Draft for a human.

## The idle check

A healthy page fetches each link's data at most twice (the route tree and the
page or metadata) and then goes quiet. A prefetch loop keeps fetching at idle.
So the check fails when either holds:

- a marked request arrives in the **last 10 s of a 30 s idle window**;
- one URL (per segment, for Next's segment prefetches) is requested **more than
  twice**.

A failure keeps the MR in Draft, the same as a High verdict without a
measurement. The volume against production gets no threshold: report the
numbers.

The two counts sit far apart, so the check needs no tuning. These are
headless-Chrome counts of `_rsc` requests over 30 s after load on one site:

| Run | Total | In the last 10 s | Worst URL |
| --- | --- | --- | --- |
| Production, healthy | 34 | 0 | every link at most twice |
| Preview, looping | 659 | 186 | one link ×303 |
| Staging, looping | 303 | 95 | one link ×274 |

## Running it

1. **Serve a production build locally**: run the project's build, then
   `next start -p <port>` (or the project's start script) as a background
   command. Note its PID: you stop it by that PID when done.
2. **Pick the browser driver.** The script drives the local Chrome either way,
   so nothing downloads a browser, and nothing touches the project's
   `package.json` or lockfile:
   - the project has `playwright` or `@playwright/test`: pass `--project <dir>`,
     and the script loads it from the project's `node_modules` with
     `channel: "chrome"`;
   - otherwise, install `puppeteer-core` next to the script, in the scratchpad:
     `npm install --prefix <scratch>/measure puppeteer-core@<version> --cache <scratch>/npm-cache`.
     The script has to sit in that same directory, because Node resolves
     `import` from the script's location. A package that `npx` fetched is not
     importable from a script outside it.
3. **Run the script** (below) from `<scratch>/measure/` on the homepage and one
   list page of the local build:
   `node <scratch>/measure/measure-rsc.mjs --project <dir> http://localhost:<port>/ http://localhost:<port>/<list>`.
   Then run the same pages against the production deployment of the project
   you are working on, for the baseline.
4. **Basic auth** (acceptance, staging): put the credentials in
   `MEASURE_BASIC_USER` and `MEASURE_BASIC_PASS` in the environment. The script
   reads them and never prints them; never pass them on the command line. `curl`
   is no substitute: Vercel answers it with a bot challenge (`429`,
   `x-vercel-mitigated: challenge`).
5. **Sandbox.** Chrome cannot start inside the command sandbox. puppeteer then
   reports "The browser is already running for …", which is misleading. Run the
   script with the sandbox bypass. The build and `next start` work sandboxed.
6. **Stop the server** by the PID from step 1 once the runs are done. Check the
   command behind the PID first.

Exit codes: `0` every page passes, `1` a page fails the idle check, `2` the
browser could not start.

## The script

Write it to `<scratch>/measure/measure-rsc.mjs`, next to a `package.json` with
`"type": "module"`.

```js
// Counts a framework's data requests on idle pages and applies the idle check.
// Usage: node measure-rsc.mjs [--project <dir>] [--chrome <path>] [--marker _rsc]
//          [--idle 30] [--sample 5] [--tail 10] <url> [<url> ...]
// Basic auth: MEASURE_BASIC_USER and MEASURE_BASIC_PASS from the environment, never printed.
// Exit 0 when every page passes, 1 when one fails the idle check, 2 on a setup error.
import { createRequire } from "node:module";
import { join } from "node:path";

const opt = {
  project: process.cwd(),
  chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  marker: "_rsc",
  idle: "30",
  sample: "5",
  tail: "10",
};
const urls = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) opt[argv[i].slice(2)] = argv[++i];
  else urls.push(argv[i]);
}
const idle = Number(opt.idle);
const sample = Number(opt.sample);
const tail = Number(opt.tail);
if (!urls.length) {
  console.error("usage: node measure-rsc.mjs [options] <url> [<url> ...]");
  process.exit(2);
}

const user = process.env.MEASURE_BASIC_USER;
const pass = process.env.MEASURE_BASIC_PASS;
const credentials = user && pass ? { username: user, password: pass } : null;

// Playwright from the project when it has it, otherwise puppeteer-core installed next to this script.
// Both drive the local Chrome, so nothing downloads a browser.
async function openBrowser() {
  const projectRequire = createRequire(join(opt.project, "package.json"));
  for (const name of ["playwright", "@playwright/test"]) {
    let chromium;
    try {
      ({ chromium } = projectRequire(name));
    } catch (err) {
      if (err.code === "MODULE_NOT_FOUND") continue;
      throw err;
    }
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    return {
      engine: name,
      newPage: async () =>
        (await browser.newContext(credentials ? { httpCredentials: credentials } : {})).newPage(),
      close: () => browser.close(),
    };
  }
  const { default: puppeteer } = await import("puppeteer-core");
  const browser = await puppeteer.launch({ executablePath: opt.chrome, headless: true });
  return {
    engine: "puppeteer-core",
    newPage: async () => {
      const page = await browser.newPage();
      if (credentials) await page.authenticate(credentials);
      return page;
    },
    close: () => browser.close(),
  };
}

const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

async function measure(browser, url) {
  const page = await browser.newPage();
  const hits = [];
  const status = {};
  // One key per URL path and, for Next's segment prefetches, per segment: a healthy link is
  // fetched at most twice (tree and metadata), so a key seen more often is a repeat.
  const keyOf = (request) => {
    const u = new URL(request.url());
    if (!u.searchParams.has(opt.marker)) return null;
    const segment = request.headers()["next-router-segment-prefetch"];
    return segment ? `${u.pathname} ${segment}` : u.pathname;
  };
  page.on("request", (request) => {
    const key = keyOf(request);
    if (key) hits.push({ t: Date.now(), key });
  });
  page.on("response", (response) => {
    const key = keyOf(response.request());
    if (key) status[key] = response.status();
  });

  await page.goto(url, { waitUntil: "load" });
  const samples = [];
  for (let s = sample; s <= idle; s += sample) {
    await sleep(sample);
    samples.push(hits.length);
  }
  const tailFrom = Date.now() - tail * 1000;
  await page.close();

  const perKey = {};
  for (const hit of hits) perKey[hit.key] = (perKey[hit.key] ?? 0) + 1;
  const lastTail = hits.filter((hit) => hit.t >= tailFrom).length;
  const maxPerUrl = Math.max(0, ...Object.values(perKey));
  const top = Object.entries(perKey)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => ({ key, count, status: status[key] ?? null }));
  return {
    url,
    total: hits.length,
    samples,
    lastTail,
    maxPerUrl,
    idle: lastTail === 0 && maxPerUrl <= 2 ? "pass" : "fail",
    top,
  };
}

let browser;
try {
  browser = await openBrowser();
} catch (err) {
  console.error(`could not start a browser: ${err.message}`);
  process.exit(2);
}
const results = [];
try {
  for (const url of urls) results.push(await measure(browser, url));
} finally {
  await browser.close();
}
for (const r of results) {
  console.log(
    `${r.idle.toUpperCase()} ${r.url}: ${opt.marker} total ${r.total}, last ${tail} s ${r.lastTail}, max per URL ${r.maxPerUrl}, samples every ${sample} s ${r.samples.join(" ")}`,
  );
  for (const t of r.top) console.log(`  ${t.count}x ${t.key} (${t.status ?? "no response"})`);
}
console.log(JSON.stringify({ engine: browser.engine, marker: opt.marker, idle, tail, results }));
process.exit(results.every((r) => r.idle === "pass") ? 0 : 1);
```

`samples` are cumulative counts at every sample point: a flat series is a page
that went quiet, and a climbing one is a loop. The script also lists the most
requested URLs with their last status, so record those in the risk block. An
earlier loop could not be traced to its cause because nobody recorded whether
the looping link answered `200` or `404`.

## Reporting

Put the result in the **Measurement** line of the risk block
(`references/risk-analysis.md` §8): the totals for production, the target and,
when there is one, the known-bad version, followed by
`idle: pass|fail (last 10 s: <n>, max per URL: <n>)` for the target. On a fail,
also give the looping URLs with their counts and status.
