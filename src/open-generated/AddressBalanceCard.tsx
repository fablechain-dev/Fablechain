import React from 'react';

interface AddressBalanceCardProps {
  balance: string;
}

const AddressBalanceCard: React.FC<AddressBalanceCardProps> = ({ balance }) => {
  return (
    <div className="address-balance-card">
      <h2>Address Balance</h2>
      <p>Balance: {balance} OPEN</p>
    </div>
  );
};

export default AddressBalanceCard;