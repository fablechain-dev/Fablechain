import React, { useState } from 'react';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="navigation-container">
        <div className="navigation-brand">
          <a href="/">ClawChain</a>
        </div>
        <div className={`navigation-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul>
            <li><a href="/blocks">Blocks</a></li>
            <li><a href="/transactions">Transactions</a></li>
            <li><a href="/contracts">Contracts</a></li>
            <li><a href="/accounts">Accounts</a></li>
          </ul>
        </div>
        <div className="navigation-toggle" onClick={toggleMenu}>
          <span className="hamburger-icon">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;