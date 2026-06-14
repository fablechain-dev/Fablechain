// Simulated AESOP coding stream. Plays scripted build sessions on a loop so
// the agent panel and the Logs tab stay alive while the real worker is offline.
// Events mirror the /api/agent/stream SSE protocol; consumers must ignore the
// sim as soon as the real stream connects.

export interface SimEvent {
  type: string;
  data?: any;
  viewerCount?: number;
}

type Listener = (evt: SimEvent) => void;

const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
const jitter = (base: number, spread: number) => base + Math.random() * spread;

type Step =
  | { kind: 'think'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'tool'; tool: string }
  | { kind: 'pause'; ms: number };

interface Session {
  title: string;
  type: string;
  reasoning: string;
  commitMsg: string;
  steps: Step[];
}

const SESSIONS: Session[] = [
  {
    title: 'Implement fee-weighted mempool eviction',
    type: 'feature',
    reasoning: 'The mempool grows unbounded under load. Stale low-fee transactions should be evicted before they crowd out fresh ones.',
    commitMsg: 'feat: fee-weighted mempool eviction with TTL sweep',
    steps: [
      { kind: 'think', text: 'The mempool currently accepts transactions until memory pressure kills the node. I will add fee-weighted eviction plus a TTL sweep that runs every block.' },
      { kind: 'text', text: '## Mempool eviction\n\nPlan:\n- Track insertion time per transaction\n- Evict lowest fee-per-byte first when over capacity\n- Sweep transactions older than 15 minutes on each new block\n\n' },
      { kind: 'tool', tool: 'Read blockchain/src/mempool.ts' },
      { kind: 'pause', ms: 1400 },
      { kind: 'tool', tool: 'Edit blockchain/src/mempool.ts' },
      { kind: 'text', text: '```ts\nprivate evict(): void {\n  const candidates = [...this.txs.values()]\n    .sort((a, b) => a.feePerByte - b.feePerByte);\n  const toDrop = candidates.slice(0, Math.ceil(this.maxSize * 0.05));\n  for (const tx of toDrop) {\n    this.txs.delete(tx.hash);\n    this.emit(\'evicted\', tx.hash);\n  }\n}\n\nsweepExpired(now: number): number {\n  let dropped = 0;\n  for (const [hash, tx] of this.txs) {\n    if (now - tx.receivedAt > TTL_MS) {\n      this.txs.delete(hash);\n      dropped++;\n    }\n  }\n  return dropped;\n}\n```\n' },
      { kind: 'pause', ms: 900 },
      { kind: 'tool', tool: 'Bash npm test -- mempool' },
      { kind: 'text', text: '\nPASS blockchain/test/mempool.test.ts\n  ✓ evicts lowest fee-per-byte first (12 ms)\n  ✓ keeps fresh transactions under pressure (9 ms)\n  ✓ TTL sweep removes expired txs (11 ms)\n\nTests: 3 passed, 3 total\n' },
    ],
  },
  {
    title: 'Verify merkle root on block ingest',
    type: 'feature',
    reasoning: 'Block ingest trusts the proposer\'s transaction list. Recomputing the merkle root makes tampering detectable.',
    commitMsg: 'feat: verify merkle root on block ingest',
    steps: [
      { kind: 'think', text: 'Blocks are currently accepted on proposer signature alone. Recomputing the merkle root over the transaction set catches any tampering between propose and apply.' },
      { kind: 'tool', tool: 'Read blockchain/src/block.ts' },
      { kind: 'text', text: '## Merkle root validation\n\nThe header carries txRoot but nothing re-derives it. Adding computeMerkleRoot and wiring it into validateBlock.\n\n' },
      { kind: 'tool', tool: 'Edit blockchain/src/validate.ts' },
      { kind: 'text', text: '```ts\nexport function computeMerkleRoot(txHashes: string[]): string {\n  if (txHashes.length === 0) return EMPTY_ROOT;\n  let level = txHashes.map(h => Buffer.from(h, \'hex\'));\n  while (level.length > 1) {\n    const next: Buffer[] = [];\n    for (let i = 0; i < level.length; i += 2) {\n      const left = level[i];\n      const right = level[i + 1] ?? left;\n      next.push(sha256(Buffer.concat([left, right])));\n    }\n    level = next;\n  }\n  return level[0].toString(\'hex\');\n}\n```\n' },
      { kind: 'pause', ms: 1100 },
      { kind: 'tool', tool: 'Bash npm test -- validate' },
      { kind: 'text', text: '\nPASS blockchain/test/validate.test.ts\n  ✓ rejects block with tampered tx set (8 ms)\n  ✓ accepts canonical root (5 ms)\n  ✓ odd leaf duplication matches reference vectors (6 ms)\n\nTests: 3 passed, 3 total\n' },
    ],
  },
  {
    title: 'Cache hot state trie reads',
    type: 'perf',
    reasoning: 'Profiling shows 38% of block apply time is trie reads for hot accounts. A small LRU in front should flatten that.',
    commitMsg: 'perf: add LRU cache in front of state trie reads',
    steps: [
      { kind: 'think', text: 'Flamegraph from the last 1,000 blocks: 38% of apply time is StateTrie.get for the same two dozen hot accounts. An LRU with ~4k entries should absorb most of it.' },
      { kind: 'tool', tool: 'Bash npm run bench -- trie' },
      { kind: 'text', text: '\nBASELINE  trie.get p50 0.41ms  p99 2.87ms  (50k reads)\n\n' },
      { kind: 'tool', tool: 'Edit blockchain/src/state/trie.ts' },
      { kind: 'text', text: '```ts\nexport class TrieReadCache {\n  private cache = new Map<string, Account>();\n  constructor(private readonly cap = 4096) {}\n\n  get(key: string): Account | undefined {\n    const hit = this.cache.get(key);\n    if (hit) {\n      this.cache.delete(key);\n      this.cache.set(key, hit); // refresh recency\n    }\n    return hit;\n  }\n\n  put(key: string, value: Account): void {\n    if (this.cache.size >= this.cap) {\n      this.cache.delete(this.cache.keys().next().value);\n    }\n    this.cache.set(key, value);\n  }\n}\n```\n' },
      { kind: 'pause', ms: 1000 },
      { kind: 'tool', tool: 'Bash npm run bench -- trie' },
      { kind: 'text', text: '\nCACHED    trie.get p50 0.09ms  p99 0.61ms  (50k reads, 91.4% hit rate)\n\np50 down 78%. Invalidation hooks into commitBlock so stale reads are impossible.\n' },
    ],
  },
  {
    title: 'Gossip new blocks to peers',
    type: 'feature',
    reasoning: 'New blocks only reach peers on their next poll. Push-based gossip cuts propagation from seconds to milliseconds.',
    commitMsg: 'feat: push-based block gossip with peer scoring',
    steps: [
      { kind: 'think', text: 'Propagation is poll-based today, so a freshly mined block takes up to 3 seconds to reach the network edge. Pushing announcements to peers directly should cut that to under 100ms.' },
      { kind: 'tool', tool: 'Read blockchain/src/p2p/peers.ts' },
      { kind: 'text', text: '## Block gossip\n\n- Announce new block hash to all peers immediately\n- Peers request the body only if they do not have it\n- Back off peers that fail or duplicate announcements\n\n' },
      { kind: 'tool', tool: 'Edit blockchain/src/p2p/gossip.ts' },
      { kind: 'text', text: '```ts\nasync broadcastBlock(block: Block): Promise<void> {\n  const announce = { type: \'NEW_BLOCK\', hash: block.hash, height: block.height };\n  await Promise.allSettled(\n    this.peers.active().map(async peer => {\n      try {\n        await peer.send(announce);\n        peer.score += 1;\n      } catch {\n        peer.score -= 5;\n        if (peer.score < 0) this.peers.backoff(peer.id);\n      }\n    })\n  );\n}\n```\n' },
      { kind: 'pause', ms: 1200 },
      { kind: 'tool', tool: 'Bash npm test -- gossip' },
      { kind: 'text', text: '\nPASS blockchain/test/gossip.test.ts\n  ✓ announces to every active peer (14 ms)\n  ✓ backs off failing peers (10 ms)\n  ✓ does not re-request known bodies (7 ms)\n\nTests: 3 passed, 3 total\n' },
    ],
  },
  {
    title: 'Harden signature verification path',
    type: 'fix',
    reasoning: 'A fuzz run produced a transaction with a 31-byte pubkey that crashes the verifier. Reject early, then batch-verify the rest.',
    commitMsg: 'fix: reject malformed pubkeys before signature verify',
    steps: [
      { kind: 'think', text: 'Overnight fuzz run hit a crash: a transaction with a truncated 31-byte pubkey throws inside ed25519 point decode and takes the worker down. Validate shape before touching the curve.' },
      { kind: 'tool', tool: 'Bash npm run fuzz -- tx-decode --replay crash-0419' },
      { kind: 'text', text: '\n> [ERROR] RangeError: point decode failed at offset 31\n    at verifySignature (blockchain/src/crypto/verify.ts:42)\n\nReproduced. The verifier assumes a 32-byte key without checking.\n\n' },
      { kind: 'tool', tool: 'Edit blockchain/src/crypto/verify.ts' },
      { kind: 'text', text: '```ts\nexport function verifyTx(tx: SignedTransaction): VerifyResult {\n  if (tx.pubkey.length !== 32) {\n    return { ok: false, reason: \'MALFORMED_PUBKEY\' };\n  }\n  if (tx.signature.length !== 64) {\n    return { ok: false, reason: \'MALFORMED_SIGNATURE\' };\n  }\n  return ed25519.verify(tx.signature, tx.hash, tx.pubkey)\n    ? { ok: true }\n    : { ok: false, reason: \'BAD_SIGNATURE\' };\n}\n```\n' },
      { kind: 'pause', ms: 900 },
      { kind: 'tool', tool: 'Bash npm run fuzz -- tx-decode --iterations 50000' },
      { kind: 'text', text: '\nfuzz: 50,000 iterations, 0 crashes, 312 malformed inputs rejected cleanly\n\nPASS blockchain/test/verify.test.ts (6 tests)\n' },
    ],
  },
  {
    title: 'Handle chain reorgs with an orphan pool',
    type: 'feature',
    reasoning: 'Two miners found blocks at the same height and the node just picked the first seen. Heaviest-chain fork choice with an orphan pool fixes convergence.',
    commitMsg: 'feat: orphan pool and heaviest-chain fork choice',
    steps: [
      { kind: 'think', text: 'Saw a natural fork at height 118,204 — two valid blocks, and nodes split on first-seen. I need an orphan pool and a fork-choice rule that follows cumulative work, then replays the losing branch\'s transactions.' },
      { kind: 'tool', tool: 'Read blockchain/src/chain.ts' },
      { kind: 'text', text: '## Fork choice\n\n- Keep competing blocks in an orphan pool keyed by parent hash\n- On import, compare cumulative work of each tip\n- Reorg: rewind to common ancestor, apply the heavier branch, return displaced txs to the mempool\n\n' },
      { kind: 'tool', tool: 'Edit blockchain/src/chain.ts' },
      { kind: 'text', text: '```ts\nprivate maybeReorg(candidate: Block): void {\n  const tipWork = this.cumulativeWork(this.tip);\n  const candWork = this.cumulativeWork(candidate);\n  if (candWork <= tipWork) {\n    this.orphans.add(candidate);\n    return;\n  }\n  const ancestor = this.commonAncestor(this.tip, candidate);\n  const displaced = this.rewindTo(ancestor);\n  this.applyBranch(ancestor, candidate);\n  this.mempool.readmit(displaced);\n  this.emit(\'reorg\', { depth: this.tip.height - ancestor.height });\n}\n```\n' },
      { kind: 'pause', ms: 1300 },
      { kind: 'tool', tool: 'Bash npm test -- chain' },
      { kind: 'text', text: '\nPASS blockchain/test/chain.test.ts\n  ✓ adopts heavier branch on import (18 ms)\n  ✓ readmits displaced transactions (11 ms)\n  ✓ depth-3 reorg converges with peers (24 ms)\n\nTests: 3 passed, 3 total\n' },
    ],
  },
];

// ---- engine (module singleton) ----

const listeners = new Set<Listener>();
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let currentTask: { id: string; title: string; type: string; agent: string } | null = null;
let currentDecision: { action: string; reasoning: string } | null = null;
let transcript = '';
let viewers = 47;
let order: number[] = [];

function emit(evt: SimEvent): void {
  listeners.forEach(l => { try { l(evt); } catch { /* listener errors must not kill the loop */ } });
}

function nextSession(): Session {
  if (order.length === 0) order = SESSIONS.map((_, i) => i).sort(() => Math.random() - 0.5);
  return SESSIONS[order.shift()!];
}

// Emit text in word-sized bursts paced near the consumer typewriter drain rate,
// so output reads as live token streaming rather than a paste.
function streamText(text: string, done: () => void): void {
  let i = 0;
  const step = () => {
    if (i >= text.length) { done(); return; }
    const n = Math.min(text.length, i + 24 + Math.floor(Math.random() * 56));
    const chunk = text.slice(i, n);
    transcript += chunk;
    emit({ type: 'text', data: chunk });
    i = n;
    timer = setTimeout(step, jitter(120, 240));
  };
  step();
}

function runSteps(session: Session, idx: number): void {
  if (idx >= session.steps.length) { finishSession(session); return; }
  const s = session.steps[idx];
  const next = () => runSteps(session, idx + 1);
  switch (s.kind) {
    case 'pause':
      timer = setTimeout(next, s.ms);
      break;
    case 'think':
      transcript += `\n[THINKING] ${s.text}\n`;
      emit({ type: 'agent_thought', data: { thought: s.text, taskTitle: session.title } });
      timer = setTimeout(next, jitter(2200, 2400));
      break;
    case 'tool':
      transcript += `\n> [TOOL] ${s.tool}\n`;
      emit({ type: 'tool_start', data: { tool: s.tool, taskTitle: session.title } });
      timer = setTimeout(next, jitter(1300, 1700));
      break;
    case 'text':
      streamText(s.text, () => { timer = setTimeout(next, jitter(600, 900)); });
      break;
  }
}

function finishSession(session: Session): void {
  const commit = hex(7);
  transcript += `\n[DEPLOYED] Commit ${commit} pushed to main\n  Message: ${session.commitMsg}\n  View: https://github.com/fablechain-dev/Fablechain/commit/${commit}\n`;
  emit({ type: 'git_deploy', data: { commit, branch: 'main', message: session.commitMsg, taskTitle: session.title } });
  timer = setTimeout(() => {
    emit({ type: 'task_complete', data: { title: session.title, taskTitle: session.title } });
    currentTask = null;
    currentDecision = null;
    timer = setTimeout(() => startSession(nextSession()), jitter(7000, 8000));
  }, jitter(1500, 1000));
}

function startSession(session: Session): void {
  currentTask = { id: hex(8), title: session.title, type: session.type, agent: 'AESOP' };
  currentDecision = { action: 'build', reasoning: session.reasoning };
  transcript = '';
  emit({ type: 'task_start', data: { task: currentTask, brainActive: true, decision: currentDecision } });
  timer = setTimeout(() => runSteps(session, 0), 800);
}

export function subscribeAgentSim(listener: Listener): () => void {
  listeners.add(listener);
  // Replay current state so late subscribers join mid-session cleanly
  if (currentTask) {
    listener({ type: 'task_start', data: { task: currentTask, brainActive: true, decision: currentDecision } });
    if (transcript) listener({ type: 'text', data: transcript });
  }
  if (!started) {
    started = true;
    // Small head start for the real SSE stream — if the backend is up, consumers
    // will be connected (and ignoring us) before the first session begins.
    timer = setTimeout(() => startSession(nextSession()), 1200);
    setInterval(() => {
      viewers = Math.max(23, Math.min(112, viewers + Math.floor(Math.random() * 9) - 4));
      emit({ type: 'heartbeat', viewerCount: viewers });
    }, 15000);
  }
  return () => { listeners.delete(listener); };
}
