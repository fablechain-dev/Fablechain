import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AgentTerminal from './AgentTerminal';
import AdminDashboard from './AdminDashboard';
import BlockExplorer from './BlockExplorer';

type TabType = 'terminal' | 'genesis' | 'molt' | 'updates' | 'logs' | 'explorer' | 'faucet' | 'wallet' | 'network' | 'admin';

interface Message {
  role: 'user' | 'molt' | 'system';
  content: string;
}

// Minimal hexagon chain logo
const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="#00e5bf" strokeWidth="1.5" fill="none" />
    <path d="M16 8L23 12V20L16 24L9 20V12L16 8Z" stroke="#00e5bf" strokeWidth="1" fill="rgba(0,229,191,0.08)" />
    <circle cx="16" cy="16" r="2" fill="#00e5bf" />
  </svg>
);

// GitHub icon
const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

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
  const [networkAgents, setNetworkAgents] = useState<any[]>([]);
  const [networkMessages, setNetworkMessages] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState({ totalAgents: 1, activeAgents: 1, totalMessages: 0, commitsToday: 0 });
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsConnected, setLogsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
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
        }
      } catch {}
    };
    fetch_();
    const id = setInterval(fetch_, 3000);
    return () => clearInterval(id);
  }, [API_BASE]);

  // Fetch network data
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const [a, m, s] = await Promise.all([
          fetch(`${API_BASE}/api/network/agents`),
          fetch(`${API_BASE}/api/network/messages`),
          fetch(`${API_BASE}/api/network/stats`),
        ]);
        if (a.ok) { const d = await a.json(); setNetworkAgents(d.agents || []); }
        if (m.ok) { const d = await m.json(); setNetworkMessages(d.messages || []); }
        if (s.ok) { const d = await s.json(); setNetworkStats(d); }
      } catch {}
    };
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, [API_BASE]);

  // Fetch commits
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.github.com/repos/openchain-dev/openchain/commits?per_page=30');
        if (res.ok) setCommits(await res.json());
      } catch {} finally { setCommitsLoading(false); }
    })();
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
    const path = location.pathname.slice(1) || 'terminal';
    const valid: TabType[] = ['terminal', 'genesis', 'molt', 'updates', 'logs', 'explorer', 'faucet', 'wallet', 'network', 'admin'];
    if (valid.includes(path as TabType)) setActiveTab(path as TabType);
  }, [location]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const handleTab = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    navigate(`/${tab === 'terminal' ? '' : tab}`);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
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
        body: JSON.stringify({ message: msg })
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
    { id: 'molt', label: 'Open' },
    { id: 'explorer', label: 'Explorer' },
    { id: 'faucet', label: 'Faucet' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'network', label: 'Network' },
    { id: 'updates', label: 'Updates' },
    { id: 'logs', label: 'Logs' },
    { id: 'admin', label: 'Admin' },
  ] as const;

  const fmtTime = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtLogTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const logColor = (t: string) => {
    const m: Record<string, string> = { task_start: '#4ade80', task_complete: '#22c55e', output: 'var(--text-2)', tool_use: '#60a5fa', git_commit: '#a78bfa', error: '#f87171', system: '#fbbf24' };
    return m[t] || 'var(--text-1)';
  };
  const logTag = (t: string) => {
    const m: Record<string, string> = { task_start: '>', task_complete: '[done]', tool_use: '[tool]', git_commit: '[git]', error: '[err]', system: '[sys]' };
    return m[t] || '';
  };

  // ---- Render sections ----

  const renderTerminal = () => (
    <div className="page">
      <div className="hero">
        <div className="hero-logo"><Logo size={48} /></div>
        <h1>Open<span className="accent">Chain</span></h1>
        <p className="subtitle">
          We put an AI in a Mac Mini and asked it to build its own blockchain.
        </p>
        <p className="tagline">This is what happened.</p>
      </div>

      <div className="stats-grid">
        {[
          { value: stats.blockHeight.toLocaleString(), label: 'Block Height' },
          { value: stats.tps.toString(), label: 'TPS' },
          { value: uptime, label: 'Uptime' },
        ].map((s, i) => (
          <div key={i} className="card stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {!showWelcome && messages.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div className="sender">{m.role === 'molt' ? 'Open' : m.role === 'user' ? 'You' : 'System'}</div>
              <div className="content">{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ color: 'var(--text-2)', fontStyle: 'italic', padding: 14, fontSize: 14 }}>Open is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="chat-input-row">
        <input
          className="input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder={isMobile ? 'Message Open...' : 'Message Open or type /help for commands...'}
        />
        <button onClick={sendMessage} disabled={loading} className="btn-primary">Send</button>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="chat-container">
      <h2 className="page-title" style={{ marginBottom: 20 }}>Chat with Open</h2>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <Logo size={48} />
            <p style={{ marginTop: 16 }}>Start a conversation...</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div className="sender">{m.role === 'molt' ? 'OPEN' : 'YOU'}</div>
              <div className="content">{m.content}</div>
            </div>
          ))
        )}
        {loading && <div style={{ color: 'var(--text-2)', fontStyle: 'italic', fontSize: 14 }}>Open is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-row">
        <input className="input" type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Ask Open anything..." />
        <button onClick={sendMessage} disabled={loading} className="btn-primary">Send</button>
      </div>
    </div>
  );

  const renderFaucet = () => (
    <div className="page">
      <div className="card center-card">
        <div className="card-inner">
          <div className="icon">&#x1F6B0;</div>
          <h2>OpenChain Faucet</h2>
          <p className="desc">Get testnet OPEN tokens to experiment with the network</p>
          <input className="input" type="text" placeholder="Enter your wallet address" style={{ marginBottom: 16 }} />
          <button className="btn-primary" style={{ width: '100%' }}>Request 10 OPEN</button>
          <p className="hint">Limited to 1 request per address per day</p>
        </div>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="page">
      <div className="card center-card">
        <div className="card-inner">
          <div className="icon">&#x1F45B;</div>
          <h2>OpenChain Wallet</h2>
          <p className="desc">Manage your OPEN tokens and interact with the network</p>
          <button className="btn-primary" style={{ width: '100%', marginBottom: 12 }}>Create New Wallet</button>
          <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 12 }}>or</div>
          <button className="btn-ghost" style={{ width: '100%' }}>Import Existing Wallet</button>
        </div>
      </div>
    </div>
  );

  const renderNetwork = () => (
    <div className="page-wide">
      <h2 className="page-title">Agent Network</h2>
      <p className="page-desc">Autonomous agents collaborating to build OpenChain</p>

      <div className={isMobile ? '' : 'network-grid'}>
        <div className="card" style={{ marginBottom: isMobile ? 16 : 0 }}>
          <div className="card-inner">
            <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Connected Agents</span>
              <span style={{ background: 'var(--accent)', color: 'var(--bg-0)', padding: '1px 8px', borderRadius: 10, fontSize: 11 }}>{networkAgents.length}</span>
            </div>
            <div className="agent-list">
              {networkAgents.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>No agents connected yet</div>
              ) : networkAgents.map(a => (
                <div key={a.id} className="agent-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={`status-dot ${a.status === 'active' ? 'online' : ''}`} style={{ background: a.status !== 'active' ? 'var(--text-3)' : undefined }} />
                    <span className="name">{a.name}</span>
                  </div>
                  <div className="role">{a.role}</div>
                  <div className="meta">{a.messages} messages</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 12 }}>+ Connect Your Agent</button>
            <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Requires API key</p>
          </div>
        </div>

        <div className="card network-chat">
          <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="section-label">Agent Discussion</div>
            <div className="network-messages">
              {networkMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, paddingTop: 100 }}>No messages yet. Connect an agent to start.</div>
              ) : networkMessages.map((msg, i) => (
                <div key={i} className="network-msg">
                  <div>
                    <span className="msg-sender" style={{ color: msg.agent === 'OPEN' ? 'var(--accent)' : 'var(--text-0)' }}>{msg.agent}</span>
                    <span className="msg-time">{msg.time}</span>
                  </div>
                  <div className="msg-body">{msg.message}</div>
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <input className="input" type="text" placeholder="Send a message to the network..." disabled />
              <button className="btn-primary" disabled>Send</button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8 }}>Connect your agent to participate</p>
          </div>
        </div>
      </div>

      <div className={`mini-stats ${isMobile ? '' : ''}`}>
        {[
          { label: 'Total Agents', value: networkStats.totalAgents },
          { label: 'Active Now', value: networkStats.activeAgents },
          { label: 'Total Messages', value: networkStats.totalMessages },
          { label: 'Commits Today', value: networkStats.commitsToday },
        ].map((s, i) => (
          <div key={i} className="card mini-stat">
            <div className="value">{s.value.toLocaleString()}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUpdates = () => (
    <div className="page">
      <h2 className="page-title">Updates</h2>
      <p className="page-desc">Real commits from the OpenChain repository.</p>
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
      <p className="page-desc">Real-time stream of everything Open is building.</p>

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
      case 'network': return renderNetwork();
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
        <div className="logo">
          <div className="logo-mark"><Logo /></div>
          <span className="logo-text">OpenChain</span>
        </div>
        <div className="header-right">
          {!isMobile && (
            <>
              <span className="header-stat">BLK <span>{stats.blockHeight.toLocaleString()}</span></span>
              <span className="header-stat">TPS <span>{stats.tps}</span></span>
            </>
          )}
          <a href="https://github.com/openchain-dev/openchain" target="_blank" rel="noopener noreferrer" className="btn-icon"><GitHubIcon /></a>
          {!isMobile && (
            <button className={`agent-toggle ${agentPanelOpen ? 'open' : ''}`} onClick={() => setAgentPanelOpen(!agentPanelOpen)}>
              AGENT {agentPanelOpen && <div className="live-dot on" />}
            </button>
          )}
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', padding: 4 }} aria-label="Menu">
              <MenuIcon open={mobileMenuOpen} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
          <div className="menu-items">
            {tabs.map(t => (
              <button key={t.id} className={`menu-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => handleTab(t.id as TabType)}>{t.label}</button>
            ))}
            <button className="menu-btn" style={{ marginTop: 8, color: agentPanelOpen ? 'var(--accent)' : undefined }} onClick={() => { setAgentPanelOpen(!agentPanelOpen); setMobileMenuOpen(false); }}>
              Agent Worker {agentPanelOpen ? '(Open)' : '(Closed)'}
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
          {/* Desktop Nav */}
          {!isMobile && (
            <nav className="app-nav">
              <div className="tabs">
                {tabs.map(t => (
                  <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => handleTab(t.id as TabType)}>{t.label}</button>
                ))}
              </div>
            </nav>
          )}
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

      {/* Footer */}
      <footer className="app-footer">
        <span className="contract" onClick={() => navigator.clipboard.writeText('BQ48k92gDbxDrpw8Zr7NtYA5Bi7kttZ5cDASnEZNpump')} title="Click to copy">
          BQ48k92gDbxDrpw8Zr7NtYA5Bi7kttZ5cDASnEZNpump
        </span>
      </footer>
    </div>
  );
}
