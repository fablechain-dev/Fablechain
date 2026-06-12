import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
  const [currentAccount, setCurrentAccount] = useState&lt;string | null&gt;(null);
  const [provider, setProvider] = useState&lt;ethers.providers.Web3Provider | null&gt;(null);

  useEffect(() => {
    const initWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(provider);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setCurrentAccount(address);
          localStorage.setItem('walletAddress', address);
        } catch (error) {
          console.error('Error connecting wallet:', error);
        }
      } else {
        console.error('MetaMask is not installed');
      }
    };
    initWallet();
  }, []);

  const connectWallet = async () => {
    if (provider) {
      try {
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setCurrentAccount(address);
        localStorage.setItem('walletAddress', address);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  const disconnectWallet = () => {
    setCurrentAccount(null);
    localStorage.removeItem('walletAddress');
  };

  return { connectWallet, disconnectWallet, currentAccount };
};