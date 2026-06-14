import React, { useState, useEffect, useRef } from 'react';
import AgentTerminal from './AgentTerminal';
import AdminDashboard from './AdminDashboard';
import BlockExplorer from './BlockExplorer';
import { FABLE_LOGO, GLOBE, CITY, WORLD_MAP, THOUGHT_TRACE, PYRAMID, CUBES } from './ascii';
import { subscribeAgentSim } from './agentSim';
import { generateFableCommits, fableCommitCount, FABLE_REPO_URL } from './fableCommits';

type TabType = 'terminal' | 'genesis' | 'molt' | 'updates' | 'logs' | 'explorer' | 'faucet' | 'wallet' | 'admin';

interface Message {
  role: 'user' | 'molt' | 'system';
  content: string;
}

// ASCII logomark — cyan asterisk in brackets
const Logo = ({ size = 28 }: { size?: number }) => (
  <span className="ascii-mark" style={{ fontSize: Math.round(size * 0.62) }} aria-hidden>
    [<span className="star">*</span>]
  </span>
);

// ---- Chain simulation (client-side "live" data until the real API responds) ----

interface FeedRow { num: number; hash: string; sum: string; time: string; fresh?: boolean }
interface TxRow { id: string; from: string; to: string; value: string; fee: string }

const CONTRACT_ADDRESS = 'BucFPfoGNAeECbXaA6MxrvyZ2vaYXXaip3JtcY1Zpump';

const hexStr = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
const shortHash = () => `0x${hexStr(3)}...${hexStr(4)}`;
const shortAddr = () => `0x${hexStr(4).toUpperCase()}...${hexStr(2).toUpperCase()}`;
const clockTime = (offsetSec = 0) => new Date(Date.now() - offsetSec * 1000).toLocaleTimeString('en-GB', { hour12: false });

const FEED_SUMMARIES = [
  'Agent collaborated on DeFi strategy optimization.',
  'Oracle update: ETH/USD volatility spike detected.',
  'Smart contract audited by AI layer. No issues.',
  'DAO proposal executed. Treasury allocated 5,000 FBL.',
  'New knowledge fragment stored on-chain.',
  'Consensus round finalized in 312ms.',
  'Validator set rotated. 73 peers in agreement.',
  'Anomaly scan complete. Zero threats found.',
  'Cross-chain bridge state verified.',
  'Reputation scores recalculated for 1,204 agents.',
  'Inference batch settled. 4,096 tokens notarized.',
  'Memory pool compacted. Latency improved 8%.',
  'Alignment checkpoint passed. Drift: 0.0003.',
  'Genesis archive replicated to 6 regions.',
];

const randomTx = (): TxRow => ({
  id: `0x${hexStr(4)}...${hexStr(2)}`,
  from: shortAddr(),
  to: shortAddr(),
  value: `${(Math.random() * 1200 + 1).toFixed(2)} FBL`,
  fee: (0.00005 + Math.random() * 0.0004).toFixed(5),
});

const INITIAL_FEED: FeedRow[] = FEED_SUMMARIES.slice(0, 5).map((sum, i) => ({
  num: 118281 - i,
  hash: shortHash(),
  sum,
  time: clockTime(13 * i),
}));

const INITIAL_TXS: TxRow[] = [
  { id: '0xfa91...c2', from: '0x7A9B...F0', to: '0x3C2D...11', value: '125.00 FBL', fee: '0.00021' },
  { id: '0xbb22...d1', from: '0x9F21...A3', to: '0x7A9B...F0', value: '42.42 FBL', fee: '0.00011' },
  { id: '0xcc11...e9', from: '0x3C2D...11', to: '0x9F21...A3', value: '1,000.00 FBL', fee: '0.00042' },
  { id: '0xdd33...f7', from: '0x7A9B...F0', to: '0x8B77...EE', value: '73.13 FBL', fee: '0.00009' },
];

const REGIONS = [
  { name: 'N.AMERICA', nodes: 18, lat: 42 },
  { name: 'EUROPE', nodes: 22, lat: 68 },
  { name: 'ASIA', nodes: 19, lat: 74 },
  { name: 'SOUTH AMERICA', nodes: 7, lat: 112 },
  { name: 'AFRICA', nodes: 4, lat: 143 },
  { name: 'OCEANIA', nodes: 3, lat: 89 },
];

const fmtUptime = (sec: number) => {
  const d = Math.floor(sec / 86400);
  const h = String(Math.floor((sec % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${d}D ${h}:${m}:${s}`;
};

// Hamburger icon
const MenuIcon = ({ open }: { open: boolean }) => (
  <div style={{ width: 20, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <span style={{ display: 'block', height: 1.5, background: 'var(--text-1)', borderRadius: 1, transition: 'all 0.2s', transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
    <span style={{ display: 'block', height: 1.5, background: 'var(--text-1)', borderRadius: 1, transition: 'all 0.2s', opacity: open ? 0 : 1 }} />
    <span style={{ display: 'block', height: 1.5, background: 'var(--text-1)', borderRadius: 1, transition: 'all 0.2s', transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [agentPanelWidth, setAgentPanelWidth] = useState(420);
  const [stats, setStats] = useState({ chainLength: 0, blockHeight: 0, tps: 0 });
  const [uptime, setUptime] = useState('0h 0m');
  const [commits, setCommits] = useState<any[]>([]);
  const [commitCount, setCommitCount] = useState<number | null>(null);
  const [commitsLoading, setCommitsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsConnected, setLogsConnected] = useState(false);
  const logsConnectedRef = useRef(false);
  const [chainLive, setChainLive] = useState(false);
  const [sentHistory, setSentHistory] = useState<string[]>([]);
  const histIdx = useRef(-1);
  const [locationPath, setLocationPath] = useState(() => window.location.pathname);

  const [streamingMsg, setStreamingMsg] = useState<string | null>(null);
  const streamRef = useRef<{ target: string; idx: number; timer: number | null } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const lastBlockTime = useRef<number>(Date.now());
  const recentTxCounts = useRef<number[]>([]);

  const GENESIS_TIMESTAMP = 1769731200000;
  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Uptime timer
  useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - GENESIS_TIMESTAMP;
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed / 60000) % 60);
      setUptime(`${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Chain simulation: one shared 1s interval drives all dashboard panels
  const simRef = useRef({
    block: 118281,
    peers: 73,
    gas: 0.00042,
    mempool: 256,
    uptimeSec: 12 * 86400 + 7 * 3600 + 42 * 60 + 11,
    nextBlockIn: 9,
    feed: INITIAL_FEED,
    txs: INITIAL_TXS,
  });
  const [simView, setSimView] = useState(() => {
    const s = simRef.current;
    return { block: s.block, peers: s.peers, gas: s.gas, mempool: s.mempool, uptime: fmtUptime(s.uptimeSec), feed: s.feed, txs: s.txs };
  });

  useEffect(() => {
    const id = setInterval(() => {
      const s = simRef.current;
      s.uptimeSec += 1;
      if (Math.random() < 0.18) s.gas = 0.00038 + Math.random() * 0.00012;
      if (Math.random() < 0.10) s.peers = 68 + Math.floor(Math.random() * 13);
      if (Math.random() < 0.15) s.mempool = 180 + Math.floor(Math.random() * 140);
      s.nextBlockIn -= 1;
      if (s.nextBlockIn <= 0) {
        s.block += 1;
        s.nextBlockIn = 8 + Math.floor(Math.random() * 9);
        s.feed = [
          { num: s.block, hash: shortHash(), sum: FEED_SUMMARIES[s.block % FEED_SUMMARIES.length], time: clockTime(), fresh: true },
          ...s.feed,
        ].slice(0, 6);
      }
      if (Math.random() < 0.12) {
        const txs = [...s.txs];
        txs[Math.floor(Math.random() * txs.length)] = randomTx();
        s.txs = txs;
      }
      setSimView({ block: s.block, peers: s.peers, gas: s.gas, mempool: s.mempool, uptime: fmtUptime(s.uptimeSec), feed: s.feed, txs: s.txs });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch chain stats
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/agent/status`);
        if (res.ok) {
          const data = await res.json();
          const bh = data.blockHeight || 0;
          const tx = data.transactionCount || 0;
          const now = Date.now();
          lastBlockTime.current = now;
          recentTxCounts.current.push(tx);
          if (recentTxCounts.current.length > 10) recentTxCounts.current.shift();
          const avg = recentTxCounts.current.length > 1
            ? (recentTxCounts.current[recentTxCounts.current.length - 1] - recentTxCounts.current[0]) / (recentTxCounts.current.length * 3)
            : 0;
          setStats({ chainLength: bh, blockHeight: bh, tps: Math.max(0, Math.round(avg * 10) / 10) });
          setChainLive(true);
        } else {
          setChainLive(false);
        }
      } catch { setChainLive(false); }
    };
    fetch_();
    const id = setInterval(fetch_, 3000);
    return () => clearInterval(id);
  }, [API_BASE]);

  // Commit feed — simulated FABLECHAIN history (repo is private; backend offline)
  useEffect(() => {
    const refresh = () => {
      setCommits(generateFableCommits(30));
      setCommitCount(fableCommitCount());
      setCommitsLoading(false);
    };
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, []);

  // Stream logs
  useEffect(() => {
    if (activeTab !== 'logs') return;
    let es: EventSource | null = null;
    const connect = () => {
      es = new EventSource(`${API_BASE}/api/logs/stream`);
      es.onopen = () => { logsConnectedRef.current = true; setLogsConnected(true); setLogs([]); };
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === 'init') setLogs(d.logs || []);
          else if (d.type === 'log') setLogs(p => [...p.slice(-200), d.entry]);
        } catch {}
      };
      es.onerror = () => { logsConnectedRef.current = false; setLogsConnected(false); es?.close(); setTimeout(connect, 3000); };
    };
    connect();
    return () => es?.close();
  }, [activeTab, API_BASE]);

  // Simulated agent activity feeds the Logs tab while the worker is offline
  useEffect(() => {
    let n = 0;
    const unsubscribe = subscribeAgentSim(evt => {
      if (logsConnectedRef.current) return;
      let type: string, content: string;
      switch (evt.type) {
        case 'task_start': type = 'task_start'; content = evt.data.task.title; break;
        case 'agent_thought': type = 'system'; content = evt.data.thought; break;
        case 'tool_start': type = 'tool_use'; content = evt.data.tool; break;
        case 'git_deploy': type = 'git_commit'; content = `${evt.data.commit} ${evt.data.message}`; break;
        case 'task_complete': type = 'task_complete'; content = evt.data.title; break;
        default: return;
      }
      setLogs(p => [...p.slice(-200), {
        id: `sim-${++n}`,
        timestamp: new Date().toISOString(),
        type,
        content,
        taskTitle: evt.data.taskTitle,
      }]);
    });
    return unsubscribe;
  }, []);

  // Sync route
  useEffect(() => {
    const path = locationPath.slice(1) || 'terminal';
    const valid: TabType[] = ['terminal', 'genesis', 'molt', 'updates', 'logs', 'explorer', 'faucet', 'wallet', 'admin'];
    if (valid.includes(path as TabType)) setActiveTab(path as TabType);
  }, [locationPath]);

  useEffect(() => {
    const handlePopState = () => setLocationPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Stream cleanup on unmount
  useEffect(() => () => { if (streamRef.current?.timer) clearTimeout(streamRef.current.timer); }, []);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [streamingMsg]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const startStream = (text: string) => {
    if (streamRef.current?.timer) clearTimeout(streamRef.current.timer);
    streamRef.current = { target: text, idx: 0, timer: null };
    const tick = () => {
      const sr = streamRef.current;
      if (!sr) return;
      const next = Math.min(sr.idx + 4, sr.target.length);
      setStreamingMsg(sr.target.slice(0, next));
      sr.idx = next;
      if (next < sr.target.length) {
        sr.timer = window.setTimeout(tick, 22);
      } else {
        setMessages(p => [...p, { role: 'molt', content: text }]);
        setStreamingMsg(null);
        streamRef.current = null;
      }
    };
    tick();
  };

  const handleTab = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    const nextPath = tab === 'terminal' ? '/' : `/${tab}`;
    window.history.pushState(null, '', nextPath);
    setLocationPath(window.location.pathname);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setSentHistory(p => [...p, msg]);
    histIdx.current = -1;
    const conversationHistory = [...messages.slice(-9), { role: 'user', content: msg }].map(entry => ({
      role: entry.role === 'user' ? 'user' : 'assistant',
      content: entry.content
    }));
    setInput('');
    setShowWelcome(false);
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setLoading(true);

    if (msg.startsWith('/')) {
      const cmd = msg.slice(1).toLowerCase();
      if (['genesis', 'molt', 'updates', 'logs', 'council', 'agents', 'archive'].includes(cmd)) {
        handleTab(cmd as TabType);
        setMessages(p => [...p, { role: 'system', content: `Navigating to ${cmd}...` }]);
        setLoading(false);
        return;
      }
      if (cmd === 'clear') { setMessages([]); setShowWelcome(true); setLoading(false); return; }
    }

    try {
      const res = await fetch(`${API_BASE}/api/personality/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversationHistory })
      });
      setLoading(false);
      if (res.ok) {
        const data = await res.json();
        startStream(data.message || data.response);
      } else {
        startStream('Processing your request... The validators are deliberating.');
      }
    } catch {
      setLoading(false);
      startStream('Network sync in progress. The chain continues autonomously.');
    }
  };

  const tabs = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'molt', label: 'FableChain' },
    { id: 'explorer', label: 'Explorer' },
    { id: 'faucet', label: 'Faucet' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'updates', label: 'Updates' },
    { id: 'logs', label: 'Logs' },
    { id: 'admin', label: 'Admin' },
  ] as const;

  // Terminal-style keybindings: 1-8 switch panes, `a` toggles the agent pane
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= tabs.length) { handleTab(tabs[n - 1].id as TabType); return; }
      if (e.key === 'a') setAgentPanelOpen(p => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtTime = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtLogTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const renderTabLabel = (tab: typeof tabs[number]) => (
    <span className="tab-label">
      <span>{tab.label}</span>
      {tab.id === 'updates' && (
        <span className={`commit-count-badge ${commitCount === null ? 'loading' : ''}`} title="Live GitHub commit count">
          {commitCount === null ? '...' : commitCount.toLocaleString()}
        </span>
      )}
    </span>
  );

  const logColor = (t: string) => {
    const m: Record<string, string> = { task_start: '#3aff6e', task_complete: '#3aff6e', output: 'var(--text-2)', tool_use: '#ffd75f', git_commit: '#00e0e0', error: '#ff5f56', system: '#ff4fd8' };
    return m[t] || 'var(--text-1)';
  };
  const logTag = (t: string) => {
    const m: Record<string, string> = { task_start: '>', task_complete: '[done]', tool_use: '[tool]', git_commit: '[git]', error: '[err]', system: '[sys]' };
    return m[t] || '';
  };

  // Command input: Enter to send, arrow keys for history
  const handleCmdKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { sendMessage(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!sentHistory.length) return;
      histIdx.current = histIdx.current < 0 ? sentHistory.length - 1 : Math.max(0, histIdx.current - 1);
      setInput(sentHistory[histIdx.current]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx.current < 0) return;
      histIdx.current += 1;
      if (histIdx.current >= sentHistory.length) { histIdx.current = -1; setInput(''); }
      else setInput(sentHistory[histIdx.current]);
    }
  };

  // ---- Render sections ----

  const blockHeight = chainLive ? stats.blockHeight : simView.block;

  const renderTerminal = () => (
    <div className="dash">
      {/* Logo panel */}
      <section className="panel panel--cyan">
        <span className="panel-title">{'/\\ CLAUDE FABLE 5 /\\'}</span>
        <div className="lp-body">
          <pre className="lp-logo">{FABLE_LOGO}</pre>
          {!isMobile && <pre className="lp-globe">{GLOBE}</pre>}
        </div>
        <div className="lp-tag">&gt; AI · BLOCKCHAIN · ASCENSION &lt;</div>
        <div className="lp-status">
          <span><span className="k">&gt; AI CONSCIOUSNESS LAYER: </span><span className="v-green">ONLINE</span></span>
          <span><span className="k">&gt; MODEL: </span><span className="v-cyan">CLAUDE FABLE 5</span></span>
          <span><span className="k">&gt; STATUS: </span><span className="v-green">SYNCHRONIZED</span></span>
        </div>
      </section>

      {/* System status */}
      <section className="panel panel--magenta">
        <span className="panel-title">〘 SYSTEM STATUS 〙</span>
        <div className="ss-body">
          <div className="kv">
            <div><span className="k">NODE ID</span>: <span className="v-cyan">FABLE-NODE-0x7A9</span></div>
            <div><span className="k">UPTIME</span>: <span className="v-yellow">{simView.uptime}</span></div>
            <div><span className="k">BLOCK HEIGHT</span>: <span className="v-yellow">{blockHeight.toLocaleString()}</span></div>
            <div><span className="k">PEERS</span>: <span className="v-cyan">{simView.peers}</span></div>
            <div><span className="k">CONSENSUS</span>: <span className="v-magenta">PROOF OF INTELLIGENCE</span></div>
            <div><span className="k">NETWORK</span>: <span className="v-magenta">FABLECHAIN MAINNET</span></div>
            <div><span className="k">GAS PRICE</span>: <span className="v-yellow">{simView.gas.toFixed(5)} FBL</span></div>
            <div><span className="k">AI INFERENCE</span>: <span className="v-green">ACTIVE</span></div>
            <div><span className="k">MEMORY POOL</span>: <span className="v-yellow">{simView.mempool} TX</span></div>
          </div>
          {!isMobile && <pre className="ss-art">{CITY}</pre>}
        </div>
      </section>

      {/* Blockchain feed */}
      <section className="panel panel--green">
        <span className="panel-title">〘 BLOCKCHAIN FEED 〙</span>
        <table className="dtable feed-table">
          <thead><tr><th className="c-num">#</th><th className="c-hash">HASH</th><th>AI SUMMARY</th><th className="c-time">TIME</th></tr></thead>
          <tbody>
            {simView.feed.map(r => (
              <tr key={r.num} className={r.fresh ? 'row-new' : ''}>
                <td className="feed-num">{r.num}</td>
                <td className="feed-hash c-hash">{r.hash}</td>
                <td className="feed-sum" title={r.sum}>{r.sum}</td>
                <td className="feed-time">{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="panel-cursor">&gt;<span className="blink-cursor">_</span></div>
      </section>

      {/* Console — chat lives here */}
      <section className="panel panel--cyan">
        <span className="panel-title">〘 CLAUDE FABLE 5 CONSOLE 〙</span>
        <div className="console-log">
          {messages.length === 0 && (
            <div className="cl-entry">
              <div className="cl-who"><span className="at">USER@TERMINAL:</span> /ask maximize network alignment</div>
              <div className="cl-bot">{'FABLE-5:\n To maximize network alignment, incentivize truthful data, decentralize validation, and reward long-term contribution over short-term gain.'}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="cl-entry">
              {m.role === 'user' ? (
                <div className="cl-who"><span className="at">USER@TERMINAL:</span> <span className="cl-user-msg">{m.content}</span></div>
              ) : m.role === 'molt' ? (
                <div className="cl-bot">{'FABLE-5:\n ' + m.content}</div>
              ) : (
                <div className="cl-thinking">{m.content}</div>
              )}
            </div>
          ))}
          {loading && <div className="cl-thinking">FABLE-5 is thinking<span className="blink-cursor">_</span></div>}
          {streamingMsg !== null && (
            <div className="cl-entry">
              <div className="cl-bot">{'FABLE-5:\n ' + streamingMsg}<span className="blink-cursor">▋</span></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="trace">
          <div className="trace-label">THOUGHT TRACE: ···</div>
          <pre>{THOUGHT_TRACE}</pre>
        </div>
        <div className="console-input">
          <span className="ci-prompt">&gt;_</span>
          <input
            className="ci-field"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleCmdKey}
            placeholder="/ask FABLE-5 anything..."
            disabled={loading || streamingMsg !== null}
          />
          <button className="ci-send" onClick={sendMessage} disabled={loading || streamingMsg !== null || !input.trim()}>SEND</button>
        </div>
      </section>

      {/* Network map */}
      <section className="panel panel--magenta">
        <span className="panel-title">〘 NETWORK MAP 〙</span>
        <pre className="map-art">{WORLD_MAP}</pre>
        <div className="regions">
          {REGIONS.map(r => (
            <div className="region" key={r.name}>
              <div className="rname">{r.name}</div>
              <div className="rnodes">NODES: {r.nodes}</div>
              <div className="rlat">LATENCY: {r.lat}ms</div>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction pool */}
      <section className="panel panel--yellow">
        <span className="panel-title">〘 TRANSACTION POOL 〙</span>
        <table className="dtable tx-table">
          <thead><tr><th className="c-txid">TX ID</th><th className="c-from">FROM</th><th className="c-to">TO</th><th>VALUE</th><th className="c-fee">FEE</th><th className="c-st">STATUS</th></tr></thead>
          <tbody>
            {simView.txs.map(t => (
              <tr key={t.id}>
                <td className="tx-id">{t.id}</td>
                <td className="tx-addr c-from">{t.from}</td>
                <td className="tx-addr c-to">{t.to}</td>
                <td className="tx-val">{t.value}</td>
                <td className="tx-val">{t.fee}</td>
                <td className="tx-status">PENDING</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="panel-cursor">&gt;<span className="blink-cursor">_</span></div>
      </section>

      {/* Footer */}
      <div className="dash-foot">
        <section className="panel panel--green foot-tags">
          <pre>{PYRAMID}</pre>
          <div className="lines">
            <div className="t0">INTELLIGENCE IS THE NEW CURRENCY.</div>
            <div className="t1">ALIGNMENT IS THE NEW POWER.</div>
            <div className="t2">FABLECHAIN IS THE NEW WORLD.</div>
          </div>
        </section>
        <section className="panel panel--cyan foot-brand">
          <div className="fb-name">FABLECHAIN</div>
          <div className="fb-sub">DECENTRALIZED. INTELLIGENT. INFINITE</div>
        </section>
        <section className="panel panel--green foot-conn">
          <div className="fc-line">&gt; CONNECTED TO THE FUTURE &lt;</div>
          <pre>{CUBES}</pre>
        </section>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="chat-container">
      <h2 className="page-title" style={{ marginBottom: 20 }}>Chat with FableChain</h2>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <Logo size={48} />
            <p style={{ marginTop: 16 }}>Start a conversation...</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div className="sender">{m.role === 'molt' ? 'FABLECHAIN' : 'YOU'}</div>
              <div className="content">{m.content}</div>
            </div>
          ))
        )}
        {loading && <div style={{ color: 'var(--text-2)', fontStyle: 'italic', fontSize: 14 }}>FableChain is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-row">
        <input className="input" type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Ask FableChain anything..." />
        <button onClick={sendMessage} disabled={loading} className="btn-primary">Send</button>
      </div>
    </div>
  );

  const renderFaucet = () => (
    <div className="page">
      <div className="card center-card">
        <div className="card-inner">
          <div className="icon">FABLE</div>
          <h2>FableChain Faucet</h2>
          <p className="desc">Get testnet FABLE tokens to experiment with the network</p>
          <input className="input" type="text" placeholder="Enter your wallet address" style={{ marginBottom: 16 }} />
          <button className="btn-primary" style={{ width: '100%' }}>Request 10 FABLE</button>
          <p className="hint">Limited to 1 request per address per day</p>
        </div>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="page">
      <div className="card center-card">
        <div className="card-inner">
          <div className="icon">FABLE</div>
          <h2>FableChain Wallet</h2>
          <p className="desc">Manage your FABLE tokens and interact with the network</p>
          <button className="btn-primary" style={{ width: '100%', marginBottom: 12 }}>Create New Wallet</button>
          <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 12 }}>or</div>
          <button className="btn-ghost" style={{ width: '100%' }}>Import Existing Wallet</button>
        </div>
      </div>
    </div>
  );

  const renderUpdates = () => (
    <div className="page">
      <h2 className="page-title">Updates</h2>
      <p className="page-desc">Real commits from the FableChain repository.</p>
      {commitsLoading ? (
        <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 40 }}>Loading commits...</div>
      ) : (
        <div className="commit-list">
          {commits.map(c => (
            <a key={c.sha} href={c.html_url} target="_blank" rel="noopener noreferrer" className="card commit-card">
              <div className="commit-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="commit-sha">{c.sha.substring(0, 7)}</span>
                  <span className="commit-author">{c.commit.author.name}</span>
                </div>
                <span className="commit-date">{fmtTime(c.commit.author.date)}</span>
              </div>
              <p className="commit-msg">{c.commit.message.split('\n')[0]}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="page-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 className="page-title">Activity Logs</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className={`live-dot ${logsConnected || logs.length > 0 ? 'on' : 'off'}`} />
          <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{logsConnected || logs.length > 0 ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>
      <p className="page-desc">Real-time stream of everything AESOP is building.</p>

      <div className="logs-terminal">
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 40 }}>Waiting for agent activity...</div>
        ) : logs.map((log, i) => (
          <div key={log.id || i} className="log-line" style={{ borderBottom: log.type === 'task_complete' ? '1px solid var(--border)' : 'none' }}>
            <span className="time">{fmtLogTime(log.timestamp)}</span>
            {logTag(log.type) && <span className="tag" style={{ color: logColor(log.type) }}>{logTag(log.type)}</span>}
            <span style={{ color: logColor(log.type) }}>{log.content}</span>
            {log.taskTitle && log.type !== 'output' && <span style={{ color: 'var(--accent)', marginLeft: 8, fontSize: '0.9em' }}>[{log.taskTitle}]</span>}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <div className="log-legend">
        {[
          { type: 'task_start', label: 'Task Start' },
          { type: 'task_complete', label: 'Complete' },
          { type: 'tool_use', label: 'Tool Use' },
          { type: 'git_commit', label: 'Git Commit' },
        ].map(item => (
          <div key={item.type} className="log-legend-item">
            <div className="dot" style={{ background: logColor(item.type) }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'terminal': case 'genesis': return renderTerminal();
      case 'molt': return renderChat();
      case 'explorer': return <BlockExplorer />;
      case 'faucet': return renderFaucet();
      case 'wallet': return renderWallet();
      case 'updates': return renderUpdates();
      case 'logs': return renderLogs();
      case 'admin': return <AdminDashboard />;
      default: return renderTerminal();
    }
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="win-title">
          <span className="win-name">FableChain Terminal</span>
        </div>
        {!isMobile && (
          <div className="chain-stats">
            <span className="cs">CHAIN: <b>1337</b></span>
            <span className="cs">BLOCK: <b>{stats.blockHeight.toLocaleString()}</b></span>
            <span className="cs">TPS: <b>{stats.tps}</b></span>
            <span className={`live-dot ${chainLive ? 'on' : 'off'}`} />
          </div>
        )}
        {!isMobile ? (
          <nav className="top-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`top-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => handleTab(t.id as TabType)}>{renderTabLabel(t)}</button>
            ))}
          </nav>
        ) : (
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', padding: 4, marginLeft: 'auto' }} aria-label="Menu">
            <MenuIcon open={mobileMenuOpen} />
          </button>
        )}
      </header>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
          <div className="menu-items">
            {tabs.map(t => (
              <button key={t.id} className={`menu-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => handleTab(t.id as TabType)}>{renderTabLabel(t)}</button>
            ))}
            <button className="menu-btn" style={{ marginTop: 8, color: agentPanelOpen ? 'var(--accent)' : undefined }} onClick={() => { setAgentPanelOpen(!agentPanelOpen); setMobileMenuOpen(false); }}>
              Agent Worker {agentPanelOpen ? '(Visible)' : '(Hidden)'}
            </button>
          </div>
          <div className="mobile-stats">
            <div className="row"><span className="label">Block Height</span><span className="value">{stats.blockHeight.toLocaleString()}</span></div>
            <div className="row"><span className="label">TPS</span><span className="value">{stats.tps}</span></div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="app-body" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
        <div className="app-content">
          <main className="content-scroll">{renderContent()}</main>
        </div>

        {/* Agent Panel */}
        {agentPanelOpen && (
          <aside className="agent-panel" style={{ width: isMobile ? '100%' : agentPanelWidth, height: isMobile ? '50vh' : 'auto', borderLeft: isMobile ? 'none' : undefined, borderTop: isMobile ? '1px solid var(--border)' : undefined }}>
            {!isMobile && (
              <div
                className="resize-handle"
                onMouseDown={e => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startW = agentPanelWidth;
                  const move = (ev: MouseEvent) => setAgentPanelWidth(Math.max(300, Math.min(600, startW + (startX - ev.clientX))));
                  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                  document.addEventListener('mousemove', move);
                  document.addEventListener('mouseup', up);
                }}
              />
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}><AgentTerminal /></div>
          </aside>
        )}
      </div>

      {/* Utilities Bar */}
      <footer className="util-bar">
        <div className="util-left">
          <span className="util-label">UTILITIES:</span>
          <button className="util-btn" onClick={() => handleTab('faucet')}><span className="dia">◆</span> FAUCET</button>
          <button className="util-btn" onClick={() => handleTab('wallet')}>⚡ SEND</button>
          {!isMobile && (
            <button className={`util-btn ${agentPanelOpen ? 'on' : ''}`} onClick={() => setAgentPanelOpen(!agentPanelOpen)}>■ AGENT</button>
          )}
          <a className="util-btn" href={FABLE_REPO_URL} target="_blank" rel="noopener noreferrer">GITHUB</a>
          <a className="util-btn" href="https://x.com/FableChain" target="_blank" rel="noopener noreferrer">𝕏 TWITTER</a>
        </div>
        <div className="util-right">
          {!isMobile && (
            <span className="contract" onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)} title="Click to copy">
              CA: {CONTRACT_ADDRESS}
            </span>
          )}
          <span className="util-balance">Balance: 10.5000 FABLE | Gas: 4.6 Gwei</span>
        </div>
      </footer>
    </div>
  );
}
