import React from 'react';
import { TransactionFeed } from './components/TransactionFeed';
import { TransactionManager } from './transaction/TransactionManager';
import { TransactionPool } from './transaction/TransactionPool';
import { TransactionValidator } from './transaction/TransactionValidator';
import { TransactionProcessor } from './transaction/TransactionProcessor';
import { EventEmitter } from './EventEmitter';

const App: React.FC = () => {
  const eventEmitter = new EventEmitter();
  const transactionPool = new TransactionPool();
  const transactionValidator = new TransactionValidator();
  const transactionProcessor = new TransactionProcessor();
  const transactionManager = new TransactionManager(
    transactionPool,
    transactionValidator,
    transactionProcessor,
    eventEmitter
  );

  return (
    <div>
      <h1>ClawChain</h1>
      <TransactionFeed transactionFeedManager={transactionManager.transactionFeedManager} />
      {/* Other components */}
    </div>
  );
};

export default App;