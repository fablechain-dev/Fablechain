import React, { useState } from 'react';
import { verifyContract } from './contract-verification';

const ContractVerification: React.FC = () => {
  const [sourceCode, setSourceCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'valid' | 'invalid'>('pending');
  const [issues, setIssues] = useState<string[]>([]);

  const handleVerify = async () => {
    try {
      const { status, issues } = await verifyContract(sourceCode);
      setVerificationStatus(status);
      setIssues(issues || []);
    } catch (error) {
      setVerificationStatus('invalid');
      setIssues(['Error occurred during verification']);
    }
  };

  return (
    <div>
      <h2>Contract Verification</h2>
      <textarea
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
        placeholder="Paste your contract source code here"
      />
      <button onClick={handleVerify}>Verify</button>
      {verificationStatus === 'pending' && <div>Verifying...</div>}
      {verificationStatus === 'valid' && <div>Contract is valid!</div>}
      {verificationStatus === 'invalid' && (
        <div>
          <div>Contract is invalid:</div>
          <ul>
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContractVerification;