import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import ContractsPage from './ContractsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/contracts">Contracts</Link>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route path="/contracts">
            <ContractsPage />
          </Route>
          <Route path="/">
            <div>Welcome to OpenChain!</div>
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;