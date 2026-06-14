import React, { useState, useEffect, useRef } from 'react';
import AgentTerminal from './AgentTerminal';
import AdminDashboard from './AdminDashboard';
import BlockExplorer from './BlockExplorer';

type TabType = 'terminal' | 'genesis' | 'molt' | 'updates' | 'logs' | 'explorer' | 'faucet' | 'wallet' | 'admin';

interface Message {
  role: 'user' | 'molt' | 'system';
  content: string;
}

// ASCII logomark — terracotta asterisk in brackets
const Logo = ({ size = 28 }: { size?: number }) => (
  <span className="ascii-mark" style={{ fontSize: Math.round(size * 0.62) }} aria-hidden>
    [<span className="star">*</span>]
  </span>
);

// Big ANSI Shadow block logo
const FABLE_BANNER =
  '███████╗ █████╗ ██████╗ ██╗     ███████╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗\n' +
  '██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝██║  ██║██╔══██╗██║████╗  ██║\n' +
  '█████╗  ███████║██████╔╝██║     █████╗  ██║     ███████║███████║██║██╔██╗ ██║\n' +
  '██╔══╝  ██╔══██║██╔══██╗██║     ██╔══╝  ██║     ██╔══██║██╔══██║██║██║╚██╗██║\n' +
  '██║     ██║  ██║██████╔╝███████╗███████╗╚██████╗██║  ██║██║  ██║██║██║ ╚████║\n' +
  '╚═╝     ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝';

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
  const [chainLive, setChainLive] = useState(false);
  const [sentHistory, setSentHistory] = useState<string[]>([]);
  const histIdx = useRef(-1);
  const [locationPath, setLocationPath] = useState(() => window.location.pathname);

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

  const parseCommitCount = (linkHeader: string | null): number | null => {
    if (!linkHeader) return null;
    const lastLink = linkHeader.split(',').find(part => part.includes('rel="last"'));
    const pageMatch = lastLink?.match(/[?&]page=(\d+)/);
    return pageMatch ? Number(pageMatch[1]) : null;
  };

  // Fetch commits and live count
  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const headers = { Accept: 'application/vnd.github+json' };
        const [listResponse, countResponse] = await Promise.all([
          fetch('https://api.github.com/repos/openchain-dev/openchain/commits?per_page=30', { headers }),
          fetch('https://api.github.com/repos/openchain-dev/openchain/commits?per_page=1', { headers })
        ]);

        if (listResponse.ok) {
          const latestCommits = await listResponse.json();
          setCommits(latestCommits);
          setCommitCount(prev => prev ?? latestCommits.length);
        }

        if (countResponse.ok) {
          const parsedCount = parseCommitCount(countResponse.headers.get('Link'));
          if (parsedCount) setCommitCount(parsedCount);
        }
      } catch {} finally { setCommitsLoading(false); }
    };

    fetchCommits();
    const id = setInterval(fetchCommits, 60000);
    return () => clearInterval(id);
  }, []);

  // Stream logs
  useEffect(() => {
    if (activeTab !== 'logs') return;
    let es: EventSource | null = null;
    const connect = () => {
      es = new EventSource(`${API_BASE}/api/logs/stream`);
      es.onopen = () => setLogsConnected(true);
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === 'init') setLogs(d.logs || []);
          else if (d.type === 'log') setLogs(p => [...p.slice(-200), d.entry]);
        } catch {}
      };
      es.onerror = () => { setLogsConnected(false); es?.close(); setTimeout(connect, 3000); };
    };
    connect();
    return () => es?.close();
  }, [activeTab, API_BASE]);

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

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

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
      if (res.ok) {
        const data = await res.json();
        setMessages(p => [...p, { role: 'molt', content: data.message || data.response }]);
      } else {
        setMessages(p => [...p, { role: 'molt', content: 'Processing your request... The validators are deliberating.' }]);
      }
    } catch {
      setMessages(p => [...p, { role: 'molt', content: 'Network sync in progress. The chain continues autonomously.' }]);
    }
    setLoading(false);
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
    const m: Record<string, string> = { task_start: '#4ade80', task_complete: '#4ade80', output: 'var(--text-2)', tool_use: '#ffbd2e', git_commit: '#ff962e', error: '#ff5f56', system: '#ffbd2e' };
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

  const renderTerminal = () => (
    <div className="page">
      <div className="hero">
        <pre className="ascii-banner">{FABLE_BANNER}</pre>
      </div>

      <div className="welcome-box">
        <div className="wb-center wb-title">FABLECHAIN TERMINAL v1.0.0</div>
        <div className="wb-center wb-sub">A BLOCKCHAIN BUILT AND MANAGED ENTIRELY BY AESOP</div>
        <p className="wb-p">
          This network is autonomously built, maintained, and validated entirely by
          AESOP, an LLM running in a Mac Mini. Every block, every transaction, every
          protocol decision is handled by the agent.
        </p>
        <div className="wb-roles">
          {['VALIDATOR', 'ARCHITECT', 'ANALYST', 'REVIEWER', 'CONSENSUS', 'ORACLE'].map(r => (
            <span key={r} className="wb-role"><span className="dia">◆</span> AESOP {r}</span>
          ))}
        </div>
        <p className="wb-p">
          Each AESOP instance operates with a specific role, together forming a
          self-governing consensus layer—negotiating protocol upgrades, validating
          transactions, and managing network state.
        </p>
        <p className="wb-p wb-handle">
          experiment by <a href="https://x.com/OpenChainSol" target="_blank" rel="noopener noreferrer">@OpenChainSol</a>
        </p>
        <p className="wb-p wb-warn">
          [!] ALPHA EXPERIMENT — AESOP-DRIVEN CONSENSUS MAY SPONTANEOUSLY
          REORGANIZE OR HALT. MONITOR STATES AND PROCEED AT YOUR OWN RISK.
        </p>
      </div>

      {!showWelcome && messages.length > 0 && (
        <div className="term-chat">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div className="sender">{m.role === 'molt' ? 'FableChain' : m.role === 'user' ? 'You' : 'System'}</div>
              <div className="content">{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ color: 'var(--text-2)', fontStyle: 'italic', padding: 14, fontSize: 14 }}>FableChain is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
      )}
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
          <div className={`live-dot ${logsConnected ? 'on' : 'off'}`} />
          <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{logsConnected ? 'Live' : 'Connecting...'}</span>
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
          <span className="tl tl-r" /><span className="tl tl-y" /><span className="tl tl-g" />
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
          {activeTab === 'terminal' && (
            <div className="cmd-bar">
              <div className="cmd-input-wrap">
                <span className="cmd-prompt">&gt;</span>
                <input
                  className="cmd-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleCmdKey}
                  placeholder="Message AESOP or type a command..."
                  disabled={loading}
                />
                <button className="cmd-send" onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
              </div>
              <div className="cmd-hints">Press Enter to send · Arrow keys for history · Type /help for commands</div>
            </div>
          )}
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
          <a className="util-btn" href="https://github.com/openchain-dev/openchain" target="_blank" rel="noopener noreferrer">GITHUB</a>
        </div>
        <div className="util-right">
          {!isMobile && (
            <span className="contract" onClick={() => navigator.clipboard.writeText('C3gj7Au7nvJ2kwyspy3gtjFxgkpoAgwqBg3yeCYQpump')} title="Click to copy">
              CA: C3gj7Au7nvJ2kwyspy3gtjFxgkpoAgwqBg3yeCYQpump
            </span>
          )}
          <span className="util-balance">Balance: 10.5000 FABLE | Gas: 4.6 Gwei</span>
        </div>
      </footer>
    </div>
  );
}
