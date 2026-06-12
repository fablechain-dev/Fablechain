import React from 'react';

interface AddressTokenHoldingsProps {
  tokens: any[];
}

const AddressTokenHoldings: React.FC<AddressTokenHoldingsProps> = ({ tokens }) => {
  return (
    <div className="address-token-holdings">
      <h2>Token Holdings</h2>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, index) => (
            <tr key={index}>
              <td>{token.name}</td>
              <td>{token.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddressTokenHoldings;