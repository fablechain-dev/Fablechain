# Fablechain Quick Audit — 2026-08-12 (personal-setup pass, charter discipline)

Scope: verify telemetry commit integrity + baseline repo health. Read-only findings.

## Findings

### F1 [MED] Middleware.ts is corrupted by a markdown fence
- Location: backend/src/rpc/Middleware.ts:1
- Evidence: line 1 is literally "```typescript" (a markdown code-fence), so the
  import statements are comments to tsc -> TS1443/TS1434/TS1005 syntax errors at
  lines 1 and 84.
- Impact: backend/src/rpc/Middleware.ts does not compile; the RPC rate-limiter
  layer is effectively dead code until fixed. Contributes to the 893 pre-existing
  tsc errors.
- Fix sketch (not applied): delete line 1 (the fence) and verify the file
  parses. One-line change, low risk.
- Effort: S
- RESOLVED 2026-08-12 by deletion. See "Update" below. NOTE: this finding
  understated the damage - the fence was one of three defects, and the
  one-line fix sketch above would NOT have made the file compile.

### F2 [LOW] rate-limiter-flexible bumped ^2.6.1 -> ^11.2.0 but never installed
- Location: package.json:102 (root), imported by backend/src/rpc/Middleware.ts:3
- Evidence: npm ls shows the package in NO node_modules (root or backend);
  backend/package.json does not declare it (relies on hoisting). The bump is
  unverified/aspirational - the module cannot resolve today.
- Fix sketch (not applied): either install it in backend, or revert the root
  bump to ^2.6.1 to match what the code was written against. Needs a decision.
- Effort: S
- RESOLVED 2026-08-12: neither option was taken. Both were moot - the sole
  consumer did not compile, so no version would have worked. Dep removed
  along with the file. See "Update" below.

### F3 [INFO] node_modules is tracked in git (AI-built repo)
- Evidence: git status shows node_modules/.bin/* as modified; repo tracks it.
- Impact: noise in every diff; 1523 files. Not touched by my commit.
- Note: leave as-is unless the owner wants a .gitignore cleanup (separate task).

## Verified clean
- Telemetry commit 4ce1e26: 12 files, 0 tsc errors in touched files (checked).
- Trace pipeline verified live earlier (fablechain.verification span in Latitude).

## Rule honored
Two-strike / evidence-only: F1+F2 are confirmed with file:line; fixes NOT applied
(read-only audit phase). Recommend fixing F1 (one line) and deciding F2 before
the next Fablechain session.

---

## Update — 2026-08-12 (resolution pass, owner-directed)

F1 and F2 are closed. Both were resolved by deleting the dead code rather than
repairing it, at the owner's direction.

### F1 was understated: three defects, not one
Re-reading backend/src/rpc/Middleware.ts found the markdown fence was only the
first problem:
- line 1: literal "```typescript" fence (the originally reported defect)
- line 49: `interface RequestMetric {...}` declared INSIDE the class body - not
  legal TypeScript
- line 244: file TRUNCATED mid-expression at `this.logger.` - the class is never
  closed, never exported, and the closing fence is absent

The file is a partial AI generation saved before it finished writing; roughly the
last 40% of the class (the error branch, method registration, export) was never
produced. The F1 fix sketch ("delete line 1") would have left a file that still
did not parse.

### Evidence the file had never run
Three independent confirmations, all verified this pass:
- rate-limiter-flexible was installed in NO node_modules (root or backend) -
  `find` returned nothing, matching F2
- nothing imported it: the only match for `RpcMiddleware` repo-wide was its own
  class declaration at line 43
- no compiled artifact: backend/dist tracks 180 build outputs but contains no
  Middleware.js

### Actions taken
- DELETED backend/src/rpc/Middleware.ts (siblings JsonRpc.ts and
  SubscriptionManager.ts untouched; neither referenced it)
- REMOVED `rate-limiter-flexible` from package.json (sole consumer was the
  deleted file)
- REMOVED `express-rate-limit` from package.json - NEW finding this pass, not in
  the original audit: it was declared but had zero call sites anywhere in the
  repo, in any file type

Both deps were declared only in the root package.json, never in
backend/package.json. Post-removal grep confirms zero dangling references.

### v2 -> v11 compatibility (researched, now moot)
Recorded in case the RPC middleware is ever rewritten. For the API surface the
deleted file used, the 9-major jump was actually clean:
- `new RateLimiterMemory({points, duration})` - v10 made both required with no
  defaults; both were passed, so this survived
- `.consume(key, 1)` - signature unchanged
- `error instanceof RateLimiterRes` - still exported, limit-exceeded rejection is
  still a RateLimiterRes; valid pattern
- v11's breaking change is confined to RLWrapperBlackAndWhite /
  isRateLimiterCompatible - was not used

One genuine bug predating the bump: line 68 passed `blockDurationMs: 60000`.
No such option exists in ANY version - it is `blockDuration`, in SECONDS. If this
file is ever reconstructed, the correct value is `blockDuration: 60`; renaming it
to `blockDuration: 60000` would produce a 16.7-hour block.
NOT verified: minimum Node version bumps across v3-v9 (not surfaced on the
releases page). Check before any future install.

### No rate-limiting regression
Removing these deps did not leave the API unprotected. Two independent layers
remain, neither of which used the deleted packages:
- backend/src/api/auth.ts - hand-rolled token buckets, per-key limits,
  X-RateLimit-* response headers
- nginx.conf:11-12,41,55 - edge limits (api 10r/s burst 20, web 30r/s burst 50)

### Still open
- F3 (node_modules tracked in git) - untouched, still ~3,900 of 7,404 tracked
  files. Separate cleanup task, owner's call.
- UNRELATED and unverified: backend/package.json carries a
  `@latitude-data/telemetry` ^4.0.0 -> ^3.3.0 DOWNGRADE, uncommitted, sitting on
  top of commit 4ce1e26 which added Latitude tracing. Deliberately left out of
  this commit. Someone should confirm tracing still works at 3.3.0 before it
  lands.
