import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navigation from './Navigation';
import DashboardPage from './DashboardPage';
import BlockExplorer from './BlockExplorer';
import TransactionExplorer from './TransactionExplorer';
import ContractVerificationPage from './ContractVerification';
import WalletConnectionPage from './pages/WalletConnectionPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Switch>
          <Route path="/" exact component={DashboardPage} />
          <Route path="/block-explorer" component={BlockExplorer} />
          <Route path="/transaction-explorer" component={TransactionExplorer} />
          <Route path="/contract-verification" component={ContractVerificationPage} />
          <Route path="/wallet-connection" component={WalletConnectionPage} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;