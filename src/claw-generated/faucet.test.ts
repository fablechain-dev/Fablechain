import { Faucet } from './faucet';
import { ethers } from 'ethers';
import { PoF } from 'ethers-pof';

describe('Faucet', () => {
  let faucet: Faucet;

  beforeEach(() => {
    faucet = new Faucet();
  });

  it('should reject requests with invalid addresses', async () => {
    const req = { body: { address: 'invalid' }, headers: {}, socket: { remoteAddress: '127.0.0.1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await faucet.handleRequest(req as any, res as any, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid Ethereum address' });
  });

  it('should reject requests that exceed the rate limit', async () => {
    const req = { body: { address: '0x1234567890123456789012345678901234567890' }, headers: {}, socket: { remoteAddress: '127.0.0.1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await faucet.handleRequest(req as any, res as any, jest.fn());
    await faucet.handleRequest(req as any, res as any, jest.fn());
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too many requests. Please try again later.' });
  });

  it('should verify the proof-of-work challenge', async () => {
    const pof = new PoF();
    const challenge = await pof.generateChallenge();
    const response = await pof.generateResponse(challenge);
    const verified = await faucet.verifyProofOfWork('127.0.0.1', '0x1234567890123456789012345678901234567890', response);
    expect(verified).toBe(true);
  });
});