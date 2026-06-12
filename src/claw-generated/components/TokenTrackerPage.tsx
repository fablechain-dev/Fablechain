import React, { useState, useEffect } from 'react';
import { useClawChain } from '../useClawChain';
import { CRC20Token } from '../types';

const TokenTrackerPage: React.FC = () => {
  const { getCRC20Tokens } = useClawChain();
  const [tokens, setTokens] = useState<CRC20Token[]>([]);

  useEffect(() => {
    const fetchTokens = async () => {
      const tokenData = await getCRC20Tokens();
      setTokens(tokenData);
    };
    fetchTokens();
  }, [getCRC20Tokens]);

  return (
    <div>
      <h1>Token Tracker</h1>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Total Supply</th>
            <th>Holders</th>
            <th>Recent Transfers</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.address}>
              <td>{token.symbol}</td>
              <td>{token.totalSupply}</td>
              <td>{token.holders.length}</td>
              <td>
                {token.recentTransfers.map((tx) => (
                  <div key={tx.hash}>
                    {tx.from} → {tx.to} ({tx.amount})
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTrackerPage;