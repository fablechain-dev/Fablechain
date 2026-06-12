import React from 'react';
import ContractVerifier from './ContractVerifier';

const ContractsPage: React.FC = () => {
  const handleVerify = (sourceCode: string) => {
    // Call contract verification API here
    console.log('Verifying contract:', sourceCode);
  };

  return (
    <div>
      <h1>Contracts</h1>
      <ContractVerifier onVerify={handleVerify} />
    </div>
  );
};

export default ContractsPage;