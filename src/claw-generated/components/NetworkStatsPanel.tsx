import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface NetworkStats {
  tps: number;
  blockTime: number;
  difficulty: number;
  hashrate: number;
  activeAddresses: number;
  timestamps: string[];
  tpsHistory: number[];
  blockTimeHistory: number[];
  difficultyHistory: number[];
  hashRateHistory: number[];
  activeAddressesHistory: number[];
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
      <h2>ClawChain Network Stats</h2>
      <div className="stats-container">
        <div className="stat-item">
          <h3>TPS</h3>
          <p>{networkStats.tps}</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkStats.tpsHistory.map((tps, i) => ({ name: networkStats.timestamps[i], value: tps }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-item">
          <h3>Block Time</h3>
          <p>{networkStats.blockTime} s</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkStats.blockTimeHistory.map((time, i) => ({ name: networkStats.timestamps[i], value: time }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-item">
          <h3>Difficulty</h3>
          <p>{networkStats.difficulty}</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkStats.difficultyHistory.map((diff, i) => ({ name: networkStats.timestamps[i], value: diff }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-item">
          <h3>Hashrate</h3>
          <p>{networkStats.hashrate} H/s</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkStats.hashRateHistory.map((rate, i) => ({ name: networkStats.timestamps[i], value: rate }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-item">
          <h3>Active Addresses</h3>
          <p>{networkStats.activeAddresses}</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkStats.activeAddressesHistory.map((addresses, i) => ({ name: networkStats.timestamps[i], value: addresses }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#00c49f" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatsPanel;