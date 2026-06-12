import React, { useState } from 'react';

interface ContractVerifierProps {
  onVerify: (sourceCode: string) => void;
}

const ContractVerifier: React.FC<ContractVerifierProps> = ({ onVerify }) => {
  const [sourceCode, setSourceCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(sourceCode);
  };

  return (
    <div>
      <h2>Contract Verifier</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Source Code:
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            rows={10}
            cols={50}
          />
        </label>
        <button type="submit">Verify</button>
      </form>
    </div>
  );
};

export default ContractVerifier;