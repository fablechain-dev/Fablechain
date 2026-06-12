import React from 'react';
import NetworkStatsPanel from '../components/NetworkStatsPanel';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page">
      <h1>ClawChain Dashboard</h1>
      <NetworkStatsPanel />
      {/* Add other dashboard components here */}
    </div>
  );
};

export default DashboardPage;