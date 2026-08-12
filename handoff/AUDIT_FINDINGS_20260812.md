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

### F2 [LOW] rate-limiter-flexible bumped ^2.6.1 -> ^11.2.0 but never installed
- Location: package.json:102 (root), imported by backend/src/rpc/Middleware.ts:3
- Evidence: npm ls shows the package in NO node_modules (root or backend);
  backend/package.json does not declare it (relies on hoisting). The bump is
  unverified/aspirational - the module cannot resolve today.
- Fix sketch (not applied): either install it in backend, or revert the root
  bump to ^2.6.1 to match what the code was written against. Needs a decision.
- Effort: S

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
