import express from 'express';
import { GovernanceController } from './governance.controller';
import { BlockchainController } from './blockchain.controller';
import RateLimiter from './rate-limiter';

const router = express.Router();
const governanceController = new GovernanceController();
const blockchainController = new BlockchainController();
const rateLimiter = new RateLimiter();

router.use(rateLimiter.middleware);

router.post('/proposals', governanceController.submitProposal.bind(governanceController));
router.get('/proposals', governanceController.getProposals.bind(governanceController));
router.post('/proposals/:proposalId/vote', governanceController.vote.bind(governanceController));

router.get('/blocks', blockchainController.getBlocks.bind(blockchainController));
router.get('/blocks/:blockHash', blockchainController.getBlock.bind(blockchainController));

export default router;