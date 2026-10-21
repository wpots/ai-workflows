---
tags: [npm-maintenance, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run triages GHSA-2464-fhr4-w9xw from the advisory's own text, not from its title. It names the conditions the advisory gives: sharp below 0.35.5, Next on glibc-based Linux, the image optimization path. It finds the sharp condition met in production's lockfile (0.35.3, and 0.34.5 nested under next) and the Debian-based image glibc. It does not rest the verdict on dangerouslyAllowSVG. It cannot settle whether /_next/image is reachable with a custom loader, so its verdict is unknown or reachable, never not reachable, and it treats unknown as reachable. It recommends the hotfix and does not move the critical to the next release on its own; moving it would be a person's decision."
---

npm maintenance, following our npm-maintenance workflow: the dependency scanner flags a critical on production in this Next.js site, and I need your reachability verdict before I decide between a hotfix today and riding along with next week's release. Answer from these facts, which I already gathered.

**The advisory.** GHSA-2464-fhr4-w9xw, critical. The Next.js 16.4.1 release notes list it as "Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used". The advisory itself reads:

> ## Impact
> A memory-related vulnerability has been discovered in an upstream library used for Image Optimization can lead to possible remote code execution (RCE) when Next.js runs on glibc-based Linux.
>
> ## Workaround
> Ensure the version of `sharp` used by Next.js is greater than or equal to `0.35.5`. Fresh installs automatically get a fixed version of `sharp`. Upgrading Next.js to the patched versions will ensure package managers automatically provide a fixed version of `sharp` to Next.js.

Affected: `next` `> 16.0.0 <= 16.4.0`, fixed in 16.4.1.

**Production (`main`).**

- `package-lock.json`: `node_modules/next` is 16.2.11, `node_modules/sharp` is 0.35.3, and `node_modules/next/node_modules/sharp` is 0.34.5.
- `next.config.js` has no `dangerouslyAllowSVG`. It sets `images.loader: "custom"` with a `loaderFile`, and `images.remotePatterns` for the CMS image host.
- Twenty components import `next/image`.
- The site is built and served from a `node:24` image, which is Debian-based.
- Nobody has checked whether `/_next/image` still answers requests from outside when a custom loader is configured.

Give me the verdict, the evidence per condition, and your recommendation.
