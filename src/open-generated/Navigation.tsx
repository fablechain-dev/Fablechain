import React from 'react';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/block-explorer">Block Explorer</Link></li>
        <li><Link to="/transaction-explorer">Transaction Explorer</Link></li>
        <li><Link to="/contract-verification">Contract Verification</Link></li>
        <li><Link to="/wallet-connection">Connect Wallet</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation;