import React, { useState } from 'react';

interface WalletConnectModalProps {
  onConnect: (address: string) => void;
  onCancel: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ onConnect, onCancel }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      // Check if MetaMask is installed and enabled
      if (!window.ethereum) {
        alert('Please install MetaMask to connect your wallet.');
        return;
      }

      // Request access to the user's MetaMask wallet
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Get the user's wallet address
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const address = accounts[0];
      setWalletAddress(address);

      // Notify the parent component that the wallet is connected
      onConnect(address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="wallet-connect-modal">
      <h2>Connect Wallet</h2>
      <p>Please connect your MetaMask wallet to continue.</p>
      {isConnecting ? (
        <div>Connecting...</div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
      <button onClick={onCancel}>Cancel</button>
      {walletAddress && <p>Connected wallet: {walletAddress}</p>}
    </div>
  );
};

export default WalletConnectModal;