import { NextFunction, Request, Response } from 'express';
import { Account } from '../models/Account';
import { Token } from '../models/Token';

export const faucetEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  const { address } = req.body;

  // Check if address has already received tokens today
  const alreadyDispensed = await Account.findOne({ address, lastDispensed: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  if (alreadyDispensed) {
    return res.status(429).json({ error: 'You can only claim tokens once per day' });
  }

  // Mint 10 CLAW tokens for the address
  await Token.mint(address, 10);

  // Update the account with the new dispense timestamp
  await Account.updateOne({ address }, { $set: { lastDispensed: new Date() } }, { upsert: true });

  res.json({ message: 'Tokens dispensed successfully' });
};