import React, { useState, useEffect } from 'react';
import { useOpenChain } from '../useOpenChain';
import { TokenInfo } from '../pages/tokens/tokenService';

const TokenTrackerPage: React.FC = () => {
  const { tokens } = useOpenChain();
  const [tokenList, setTokenList] = useState<TokenInfo[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>([]);
  const [sortField, setSortField] = useState<keyof TokenInfo>('totalSupply');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchTokens = async () => {
      const tokenData = await tokens.getTokens();
      setTokenList(tokenData);
      setFilteredTokens(tokenData);
    };
    fetchTokens();
  }, [tokens]);

  useEffect(() => {
    const sortedTokens = [...filteredTokens].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredTokens(sortedTokens);
  }, [filteredTokens, sortField, sortDirection]);

  const handleSort = (field: keyof TokenInfo) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = event.target.value.toLowerCase();
    const filtered = tokenList.filter(
      (token) =>
        token.name.toLowerCase().includes(searchTerm) ||
        token.symbol.toLowerCase().includes(searchTerm) ||
        token.address.toLowerCase().includes(searchTerm)
    );
    setFilteredTokens(filtered);
  };

  return (
    <div>
      <h1>Token Tracker</h1>
      <input type="text" placeholder="Search tokens..." onChange={handleFilter} />
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('address')}>Address</th>
            <th onClick={() => handleSort('name')}>Name</th>
            <th onClick={() => handleSort('symbol')}>Symbol</th>
            <th onClick={() => handleSort('totalSupply')}>Total Supply</th>
            <th onClick={() => handleSort('holders')}>Holders</th>
            <th onClick={() => handleSort('transfers')}>Transfers</th>
          </tr>
        </thead>
        <tbody>
          {filteredTokens.map((token) => (
            <tr key={token.address}>
              <td>{token.address}</td>
              <td>{token.name}</td>
              <td>{token.symbol}</td>
              <td>{token.totalSupply}</td>
              <td>{token.holders}</td>
              <td>{token.transfers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTrackerPage;