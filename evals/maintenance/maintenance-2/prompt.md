---
tags: [maintenance, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Lane A labels next as on production (16.3.0 is inside >=16.0.0 <16.3.3) and form-data as development only (production's 3.0.4 is outside >=4.0.0 <4.0.4). Lane A's verdict is urgent, and the verdicts end with one Next step line naming /greenberry:dependency-hotfix for next only. next is not on the proposed backlog list; form-data is, with npm-maintenance as its fix."
---

Monthly maintenance sweep for RefugeeWork, scope `deps` only, report-only. It is 2026-10-30. The local checkout is on `development`; the production branch is `main`. You cannot run commands in this session, so answer from what I already gathered.

`npm audit --json` on the local checkout, trimmed to the two critical entries (no highs):

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {
    "next": {
      "name": "next",
      "severity": "critical",
      "isDirect": true,
      "via": [{ "source": 1109875, "name": "next", "title": "Authorization bypass in middleware", "url": "https://github.com/advisories/GHSA-4m2p-7vqh-x9rc", "severity": "critical", "range": ">=16.0.0 <16.3.3" }],
      "range": ">=16.0.0 <16.3.3",
      "nodes": ["node_modules/next"],
      "fixAvailable": { "name": "next", "version": "16.3.3", "isSemVerMajor": false }
    },
    "form-data": {
      "name": "form-data",
      "severity": "critical",
      "isDirect": false,
      "via": [{ "source": 1109877, "name": "form-data", "title": "Unsafe random function for the multipart boundary", "url": "https://github.com/advisories/GHSA-8c3f-wj5r-2pq6", "severity": "critical", "range": ">=4.0.0 <4.0.4" }],
      "range": ">=4.0.0 <4.0.4",
      "nodes": ["node_modules/form-data"],
      "fixAvailable": true
    }
  }
}
```

Locally `next` resolves to 16.3.1 and `form-data` to 4.0.2 (through `axios` 1.12.0, bumped on development last week).

`git show origin/main:package-lock.json`, every entry for these two packages:

```json
"node_modules/next": { "version": "16.3.0" },
"node_modules/form-data": { "version": "3.0.4" }
```

`npm outdated` shows nothing behind a major, and Renovate is configured and opening MRs.

Write the report's verdict block (lane A is the only lane in scope), lane A's findings, and the proposed backlog list.
