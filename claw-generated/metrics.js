const client = require('prom-client');

// Create Prometheus metrics
const blockCounter = new client.Counter({
  name: 'clawchain_blocks_produced',
  help: 'Total number of blocks produced'
});

const transactionCounter = new client.Counter({
  name: 'clawchain_transactions_processed',
  help: 'Total number of transactions processed'
});

const peerGauge = new client.Gauge({
  name: 'clawchain_connected_peers',
  help: 'Number of connected peers'
});

// Update metrics as events occur
function updateMetrics(block, transactions) {
  blockCounter.inc();
  transactionCounter.inc(transactions.length);
  peerGauge.set(this.peers.length);
}

module.exports = {
  updateMetrics
};