import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AgentTerminal from '../frontend/src/AgentTerminal';
import AdminDashboard from '../frontend/src/AdminDashboard';
import BlockExplorer from '../frontend/src/BlockExplorer';
import WalletModal from './WalletModal';

// Types
type TabType = 'terminal' | 'genesis' | 'molt' | 'updates' | 'logs' | 'explorer' | 'faucet' | 'wallet' | 'network' | 'admin';

interface Message {
  role: 'user' | 'molt' | 'system';
  content: string;
}

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
  const [stats, setStats] = useState({
    chainLength: 0,
    blockHeight: 0,
    tps: 0
  });
  const [uptime, setUptime] = useState('0h 0m');
  const [networkAgents, setNetworkAgents] = useState<any[]>([]);
  const [networkMessages, setNetworkMessages] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState({ totalAgents: 1, activeAgents: 1, totalMessages: 0, commitsToday: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const lastBlockTime = useRef<number>(Date.now());
  const recentTxCounts = useRef<number[]>([]);

  // Fixed genesis timestamp - Jan 30, 2026 00:00:00 UTC
  const GENESIS_TIMESTAMP = 1769731200000;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Real uptime timer - total hours since genesis
  useEffect(() => {
    const updateUptime = () => {
      const elapsed = Date.now() - GENESIS_TIMESTAMP;
      const totalHours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
      setUptime(`${totalHours}h ${minutes}m`);
    };
    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, []);

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

  // Fetch network data
  useEffect(() => {
    const fetchNetworkData = async () => {
      // Fetch network data logic
    };

    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 5000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  // Sync route to tab
  useEffect(() => {
    const path = location.pathname.slice(1) || 'terminal';
    const validTabs: TabType[] = ['terminal', 'genesis', 'molt', 'updates', 'logs', 'explorer', 'faucet', 'wallet', 'network', 'admin'];
    if (validTabs.includes(path as TabType)) {
      setActiveTab(path as TabType);
    }
  }, [location]);

  // Fetch real chain stats
  useEffect(() => {
    const fetchStats = async () => {
      // Fetch chain stats logic
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  const handleWalletConnect = (address: string) => {
    setConnectedAccount(address);
    // Add any other logic for handling the connected account
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    navigate(`/${tab === 'terminal' ? '' : tab}`);
  };

  const sendMessage = async () => {
    // Message sending logic
  };

  const tabs = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'molt', label: 'Claw' },
    { id: 'explorer', label: 'Explorer' },
    { id: 'faucet', label: 'Faucet' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'network', label: 'Network' },
    { id: 'updates', label: 'Updates' },
    { id: 'logs', label: 'Logs' },
    { id: 'admin', label: 'Admin' },
  ] as const;

  const renderContent = () => {
    // Render content logic
  };

  return (
    <div>
      <WalletModal onConnect={handleWalletConnect} />
      {/* Existing App component JSX */}
    </div>
  );
}