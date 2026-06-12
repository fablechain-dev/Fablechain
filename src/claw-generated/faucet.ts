import { Request, Response } from 'express';
import { getAddressBalance, mintTokens } from './blockchain';
import { addFaucetRequest, getFaucetRequestsByAddress } from './database';

export const faucetRoute = async (req: Request, res: Response) => {
  const { address } = req.body;

  // Check if address has already received tokens in the last 24 hours
  const previousRequests = await getFaucetRequestsByAddress(address);
  const lastRequestTime = previousRequests.length > 0 ? previousRequests[0].timestamp : 0;
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  if (timeSinceLastRequest < oneDay) {
    return res.status(429).json({ error: 'You can only request from the faucet once per day' });
  }

  // Mint 10 CLAW tokens and send to the address
  await mintTokens(address, 10);

  // Record the faucet request in the database
  await addFaucetRequest(address);

  res.status(200).json({ message: 'Faucet tokens sent successfully' });
};