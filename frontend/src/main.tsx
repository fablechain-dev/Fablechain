import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import NetworkApp from './NetworkApp';
import './index.css';

// Detect if we're on the network subdomain
const isNetworkSubdomain = window.location.hostname === 'network.fablechain.app';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isNetworkSubdomain ? (
      <NetworkApp />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
