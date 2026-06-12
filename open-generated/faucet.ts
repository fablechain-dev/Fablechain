import { Request, Response } from 'express';
import { OPEN } from '../token/OPEN';
import { FaucetDB } from '../db/FaucetDB';

export async function faucetHandler(req: Request, res: Response) {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  // Check if address has already requested tokens today
  const lastRequest = await FaucetDB.getLastRequestForAddress(address);
  const isWithinRateLimit = lastRequest && lastRequest.getTime() > Date.now() - 24 * 60 * 60 * 1000;

  if (isWithinRateLimit) {
    return res.status(429).json({ error: 'You can only request tokens once per day' });
  }

  try {
    // Mint 10 OPEN tokens
    await OPEN.mint(address, 10);

    // Record the request in the database
    await FaucetDB.recordRequest(address);

    res.status(200).json({ message: 'Tokens minted successfully' });
  } catch (error) {
    console.error('Error minting tokens:', error);
    res.status(500).json({ error: 'Failed to mint tokens' });
  }
}