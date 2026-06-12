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
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    tps: 0,
    blockTime: 0,
    difficulty: 0,
    hashrate: 0,
    activeAddresses: 0
  });

  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        const response = await axios.get('/api/network/stats');
        setNetworkStats(response.data);
      } catch (error) {
        console.error('Error fetching network stats:', error);
      }
    };

    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 60000); // Fetch stats every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="network-stats-panel">
      <h2>Network Stats</h2>
      <div>
        <span>TPS:</span> {networkStats.tps.toLocaleString()}
      </div>
      <div>
        <span>Block Time:</span> {networkStats.blockTime.toLocaleString()} seconds
      </div>
      <div>
        <span>Difficulty:</span> {networkStats.difficulty.toLocaleString()}
      </div>
      <div>
        <span>Hashrate:</span> {networkStats.hashrate.toLocaleString()} H/s
      </div>
      <div>
        <span>Active Addresses:</span> {networkStats.activeAddresses.toLocaleString()}
      </div>
    </div>
  );
};

export default NetworkStatsPanel;