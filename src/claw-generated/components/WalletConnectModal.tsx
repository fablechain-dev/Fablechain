import React, { useState } from 'react';
import { ethers } from 'ethers';

interface WalletConnectModalProps {
  onConnect: (address: string) => void;
  onCancel: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ onConnect, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    setLoading(true);
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('Please install MetaMask to connect your wallet.');
        return;
      }

      // Request user authorization
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      onConnect(address);
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-connect-modal">
      <h2>Connect Wallet</h2>
      {error && <div className="error">{error}</div>}
      <button onClick={connectWallet} disabled={loading}>
        {loading ? 'Loading...' : 'Connect with MetaMask'}
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};

export default WalletConnectModal;