import React from 'react';
import WalletModal from './WalletModal';
import { useWallet } from './useWallet';

const App: React.FC = () => {
  const { currentAccount } = useWallet();

  return (
    <div>
      <header>
        <h1>ClawChain</h1>
        {currentAccount ? (
          <p>Connected: {currentAccount}</p>
        ) : (
          <WalletModal />
        )}
      </header>
      <main>
        {/* Add your app content here */}
      </main>
    </div>
  );
};

export default App;