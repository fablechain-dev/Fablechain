import React from 'react';
import NetworkStatsPanel from './NetworkStatsPanel';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page">
      <h1>OpenChain Dashboard</h1>
      <NetworkStatsPanel />
    </div>
  );
};

export default DashboardPage;