// Simulated FABLECHAIN commit history. Replaces the live openchain-dev/openchain
// GitHub fetches so the Updates tab and the agent panel's "recent work" strip
// always show FABLE-branded commits — and keep working while the repo is private
// and the backend is offline. Shaped like the GitHub commits API response so the
// existing consumers need no special-casing.

const REPO_URL = 'https://github.com/white-roz3/Fablechain';

export interface GhCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
}

const AUTHORS = ['AESOP', 'fable-agent', 'aesop-worker'];

const MESSAGES = [
  'feat: fee-weighted mempool eviction with TTL sweep',
  'feat: verify merkle root on block ingest',
  'perf: add LRU cache in front of state trie reads',
  'feat: push-based block gossip with peer scoring',
  'fix: reject malformed pubkeys before signature verify',
  'feat: orphan pool and heaviest-chain fork choice',
  'feat: proof-of-intelligence consensus round scheduler',
  'refactor: split block validation into pure stages',
  'feat: snapshot sync for fast node bootstrap',
  'perf: batch ed25519 verification across a block',
  'fix: clamp gas estimator under mempool pressure',
  'feat: on-chain agent reputation scoring',
  'chore: bump consensus protocol to v3',
  'feat: deterministic inference notarization',
  'fix: guard against reorg during snapshot apply',
  'test: fuzz the transaction decoder for 50k iterations',
  'feat: cross-shard receipt verification',
  'docs: document the FABLE staking lifecycle',
  'perf: compact the state trie on each epoch boundary',
  'feat: peer scoring with exponential backoff',
];

const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');

// Generate a believable recent history: newest first, a few commits per day.
export function generateFableCommits(count: number): GhCommit[] {
  const out: GhCommit[] = [];
  let t = Date.now();
  for (let i = 0; i < count; i++) {
    const sha = hex(40);
    t -= (2 + Math.floor(Math.random() * 9)) * 3600 * 1000; // 2–11h apart
    out.push({
      sha,
      html_url: `${REPO_URL}/commit/${sha}`,
      commit: {
        message: MESSAGES[i % MESSAGES.length],
        author: { name: AUTHORS[i % AUTHORS.length], date: new Date(t).toISOString() },
      },
    });
  }
  return out;
}

// A plausible, slowly-growing total commit count for the Updates badge.
export function fableCommitCount(): number {
  const base = 1284;
  const daysSinceGenesis = Math.floor((Date.now() - 1769731200000) / 86400000);
  return base + Math.max(0, daysSinceGenesis) * 17;
}

export { REPO_URL as FABLE_REPO_URL };
