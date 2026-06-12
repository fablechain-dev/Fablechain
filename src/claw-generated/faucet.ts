import { Request, Response } from 'express';
import { getAccountBalance, sendFunds } from '../blockchain';
import { redis } from '../redis';

const FAUCET_COOLDOWN_SECONDS = 86400; // 24 hours
const FAUCET_LIMIT_PER_IP = 3;
const FAUCET_LIMIT_PER_ADDRESS = 1;

export async function handleFaucetRequest(req: Request, res: Response) {
  const { address } = req.body;
  const ip = req.ip;

  // Check IP rate limit
  const ipRequests = await redis.get(`faucet:ip:${ip}`);
  if (ipRequests && parseInt(ipRequests) >= FAUCET_LIMIT_PER_IP) {
    return res.status(429).json({ error: 'Too many requests from this IP' });
  }

  // Check address rate limit
  const addressRequests = await redis.get(`faucet:address:${address}`);
  if (addressRequests && parseInt(addressRequests) >= FAUCET_LIMIT_PER_ADDRESS) {
    return res.status(429).json({ error: 'Too many requests from this address' });
  }

  // Increment request counts
  await redis.incr(`faucet:ip:${ip}`);
  await redis.incr(`faucet:address:${address}`);
  await redis.expire(`faucet:ip:${ip}`, FAUCET_COOLDOWN_SECONDS);
  await redis.expire(`faucet:address:${address}`, FAUCET_COOLDOWN_SECONDS);

  // Send funds
  const balance = await getAccountBalance(address);
  await sendFunds(address, 1000000); // 1 CLAW token

  res.json({ success: true, balance });
}