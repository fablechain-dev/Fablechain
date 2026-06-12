import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Input } from 'components';
import { getTokens, getTokenTransfers } from 'services/tokens';

const TokenTracker: React.FC = () => {
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTokenData();
  }, []);

  const fetchTokenData = async () => {
    const tokens = await getTokens();
    setTokens(tokens);
  };

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container>
      <h1>Token Tracker</h1>
      <Input
        placeholder="Search tokens..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Symbol</th>
            <th>Total Supply</th>
            <th>Holders</th>
            <th>Transfers</th>
          </tr>
        </thead>
        <tbody>
          {filteredTokens.map(token => (
            <tr key={token.address}>
              <td>{token.name}</td>
              <td>{token.symbol}</td>
              <td>{token.totalSupply}</td>
              <td>{token.holderCount}</td>
              <td>
                <Button onClick={() => viewTokenTransfers(token.address)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default TokenTracker;