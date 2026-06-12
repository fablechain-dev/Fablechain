import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NetworkStatsPanel.css';

interface NetworkStats {
  tps: number;
  blockTime: number;
  difficulty: number;
  hashrate: number;
  activeAddresses: number;
}

const NetworkStatsPanel: React.FC = () => {
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);

  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        const response = await axios.get('/api/network-stats');
        setNetworkStats(response.data);
      } catch (error) {
        console.error('Error fetching network stats:', error);
      }
    };

    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!networkStats) {
    return <div className="network-stats-panel">Loading...</div>;
  }

  return (
    <div className="network-stats-panel">
      <div className="stat-item">
        <div className="stat-label">TPS</div>
        <div className="stat-value">{networkStats.tps.toFixed(2)}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Block Time</div>
        <div className="stat-value">{networkStats.blockTime.toFixed(2)} s</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Difficulty</div>
        <div className="stat-value">{networkStats.difficulty.toFixed(2)}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Hashrate</div>
        <div className="stat-value">{networkStats.hashrate.toFixed(2)} GH/s</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Active Addresses</div>
        <div className="stat-value">{networkStats.activeAddresses.toFixed(0)}</div>
      </div>
    </div>
  );
};

export default NetworkStatsPanel;