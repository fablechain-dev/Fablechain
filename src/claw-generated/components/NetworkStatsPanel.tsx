import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  }, []);

  if (!networkStats) {
    return <div>Loading network stats...</div>;
  }

  return (
    <div className="network-stats-panel">
      <h2>Network Stats</h2>
      <div className="stats-container">
        <div className="stat-item">
          <h3>TPS</h3>
          <p>{networkStats.tps}</p>
        </div>
        <div className="stat-item">
          <h3>Block Time</h3>
          <p>{networkStats.blockTime} s</p>
        </div>
        <div className="stat-item">
          <h3>Difficulty</h3>
          <p>{networkStats.difficulty}</p>
        </div>
        <div className="stat-item">
          <h3>Hashrate</h3>
          <p>{networkStats.hashrate} H/s</p>
        </div>
        <div className="stat-item">
          <h3>Active Addresses</h3>
          <p>{networkStats.activeAddresses}</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatsPanel;