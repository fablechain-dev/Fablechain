import React, { useState, useEffect } from 'react';
import { getTransactionRate, getAverageBlockTime, getMiningDifficulty, getNetworkHashrate, getActiveAddresses } from './networkStatsService';

const NetworkStatsPanel: React.FC = () => {
  const [transactionRate, setTransactionRate] = useState(0);
  const [averageBlockTime, setAverageBlockTime] = useState(0);
  const [miningDifficulty, setMiningDifficulty] = useState(0);
  const [networkHashrate, setNetworkHashrate] = useState(0);
  const [activeAddresses, setActiveAddresses] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      setTransactionRate(await getTransactionRate());
      setAverageBlockTime(await getAverageBlockTime());
      setMiningDifficulty(await getMiningDifficulty());
      setNetworkHashrate(await getNetworkHashrate());
      setActiveAddresses(await getActiveAddresses());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="network-stats-panel">
      <h2>Network Stats</h2>
      <div className="stat-item">
        <h3>Transactions per Second</h3>
        <p>{transactionRate.toFixed(2)}</p>
      </div>
      <div className="stat-item">
        <h3>Average Block Time</h3>
        <p>{averageBlockTime.toFixed(2)} seconds</p>
      </div>
      <div className="stat-item">
        <h3>Mining Difficulty</h3>
        <p>{miningDifficulty.toFixed(2)}</p>
      </div>
      <div className="stat-item">
        <h3>Network Hashrate</h3>
        <p>{networkHashrate.toFixed(2)} H/s</p>
      </div>
      <div className="stat-item">
        <h3>Active Addresses</h3>
        <p>{activeAddresses}</p>
      </div>
    </div>
  );
};

export default NetworkStatsPanel;