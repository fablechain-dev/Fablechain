import { NextFunction, Request, Response } from 'express';
import { ethers } from 'ethers';
import { PoF } from 'ethers-pof';

export class Faucet {
  private requests: Map<string, { address: string; timestamp: number }> = new Map();
  private cooldownPeriod = 60 * 60 * 1000; // 1 hour

  async handleRequest(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const address = req.body.address;

    // Check rate limit
    const lastRequest = this.requests.get(ipAddress);
    if (lastRequest && Date.now() - lastRequest.timestamp < this.cooldownPeriod) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Validate address
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Verify proof-of-work
    if (!(await this.verifyProofOfWork(ipAddress, address))) {
      return res.status(403).json({ error: 'Proof-of-work verification failed' });
    }

    // Send tokens to the address
    // ...

    // Update request tracking
    this.requests.set(ipAddress, { address, timestamp: Date.now() });

    return res.json({ message: 'Tokens sent successfully' });
  }

  private async verifyProofOfWork(ipAddress: string, address: string): Promise<boolean> {
    const pof = new PoF();
    const challenge = await pof.generateChallenge();
    const response = req.body.proofOfWork;

    if (await pof.verifyResponse(challenge, response)) {
      return true;
    } else {
      return false;
    }
  }
}