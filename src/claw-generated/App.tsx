import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import TransactionFeed from './components/TransactionFeed';
import { TransactionPool } from './TransactionPool';
import { TransactionBroadcaster } from './network/transaction-broadcaster';

const App: React.FC = () => {
  const transactionBroadcaster = new TransactionBroadcaster();
  const transactionPool = new TransactionPool(transactionBroadcaster);

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/transaction-feed">Transaction Feed</Link>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route path="/transaction-feed">
            <TransactionFeed transactionPool={transactionPool} />
          </Route>
          <Route path="/">
            <h1>ClawChain</h1>
            <p>Welcome to the ClawChain decentralized blockchain platform.</p>
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;