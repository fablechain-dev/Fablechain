import { Blockchain } from './blockchain';
import { Block } from './block';
import { API } from './api';

const blockchain = new Blockchain();

// Add some sample blocks
blockchain.addBlock(new Block('block1', 'prevHash', 1234, []));
blockchain.addBlock(new Block('block2', 'block1', 1235, []));
blockchain.addBlock(new Block('block3', 'block2', 1236, []));
blockchain.addBlock(new Block('block4', 'block3', 1237, []));
blockchain.addBlock(new Block('block5', 'block4', 1238, []));
blockchain.addBlock(new Block('block6', 'block5', 1239, []));

const api = new API(blockchain);

console.log(api.getBlockFinality('block1')); // { finalized: true, confirmations: 6 }
console.log(api.getBlockFinality('block3')); // { finalized: false, confirmations: 4 }