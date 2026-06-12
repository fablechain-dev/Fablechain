import React, { useState, useEffect } from 'react';
import { getTokenData } from './api/tokens';

const TokenTracker: React.FC = () => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokenData = async () => {
      const tokenData = await getTokenData();
      setTokens(tokenData);
    };
    fetchTokenData();
  }, []);

  return (
    <div>
      <h1>Token Tracker</h1>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Supply</th>
            <th>Holders</th>
            <th>Recent Transfers</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.address}>
              <td>{token.name}</td>
              <td>{token.totalSupply}</td>
              <td>{token.holderCount}</td>
              <td>{token.recentTransfers.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTracker;