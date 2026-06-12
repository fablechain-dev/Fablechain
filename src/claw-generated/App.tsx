import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AddressPage from './AddressPage';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/address/:address" component={AddressPage} />
      </Switch>
    </Router>
  );
};

export default App;