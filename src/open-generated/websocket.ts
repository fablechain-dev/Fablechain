import WebSocket from 'ws';
import { logger } from './utils/logger';
import { Blockchain } from './blockchain/blockchain';
import { TransactionPool } from './transaction/transaction_mempool';
import { AccountStorage } from './AccountStorage';

const wss = new WebSocket.Server({ port: 8080 });

const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const accountStorage = new AccountStorage();

const subscriptions: { [id: string]: { type: string; data: any; callback: (data: any) => void } } = {};

wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');
  let clientId = 0;

  ws.on('message', (message) => {
    try {
      const { type, data, id } = JSON.parse(message);
      switch (type) {
        case 'newBlock':
          subscriptions[id] = {
            type: 'newBlock',
            data: null,
            callback: (block) => {
              ws.send(JSON.stringify({ type: 'newBlock', data: block, id }));
            },
          };
          blockchain.subscribeToNewBlocks(subscriptions[id].callback);
          break;
        case 'transactionConfirmed':
          subscriptions[id] = {
            type: 'transactionConfirmed',
            data: data.address,
            callback: (transactions) => {
              ws.send(JSON.stringify({ type: 'transactionConfirmed', data: transactions, id }));
            },
          };
          transactionPool.subscribeToTransactionConfirmations(data.address, subscriptions[id].callback);
          break;
        case 'accountUpdated':
          subscriptions[id] = {
            type: 'accountUpdated',
            data: data.address,
            callback: (account) => {
              ws.send(JSON.stringify({ type: 'accountUpdated', data: account, id }));
            },
          };
          accountStorage.subscribeToAccountUpdates(data.address, subscriptions[id].callback);
          break;
        case 'unsubscribe':
          const subscription = subscriptions[data.id];
          if (subscription) {
            switch (subscription.type) {
              case 'newBlock':
                blockchain.unsubscribeFromNewBlocks(subscription.callback);
                break;
              case 'transactionConfirmed':
                transactionPool.unsubscribeFromTransactionConfirmations(
                  subscription.data,
                  subscription.callback
                );
                break;
              case 'accountUpdated':
                accountStorage.unsubscribeFromAccountUpdates(
                  subscription.data,
                  subscription.callback
                );
                break;
            }
            delete subscriptions[data.id];
          }
          break;
        default:
          logger.warn(`Unsupported subscription type: ${type}`);
      }
    } catch (err) {
      logger.error(`Error handling WebSocket message: ${err}`);
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
    // Clean up any active subscriptions for this client
    Object.keys(subscriptions).forEach((id) => {
      if (subscriptions[id].callback) {
        switch (subscriptions[id].type) {
          case 'newBlock':
            blockchain.unsubscribeFromNewBlocks(subscriptions[id].callback);
            break;
          case 'transactionConfirmed':
            transactionPool.unsubscribeFromTransactionConfirmations(
              subscriptions[id].data,
              subscriptions[id].callback
            );
            break;
          case 'accountUpdated':
            accountStorage.unsubscribeFromAccountUpdates(
              subscriptions[id].data,
              subscriptions[id].callback
            );
            break;
        }
      }
      delete subscriptions[id];
    });
  });
});

logger.info('WebSocket server started');