import { Request, Response } from 'express';
import { CLAW } from '../token/CLAW';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function faucetHandler(req: Request, res: Response) {
  const { address } = req.body;

  // Check if the address has already received tokens in the past 24 hours
  const lastRequest = await prisma.faucetRequest.findFirst({
    where: {
      address,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (lastRequest) {
    return res.status(429).json({ error: 'You can only request tokens once per day' });
  }

  // Mint and transfer 10 CLAW tokens to the address
  await CLAW.mint(address, 10);

  // Store the faucet request in the database
  await prisma.faucetRequest.create({
    data: {
      address,
      createdAt: new Date(),
    },
  });

  return res.status(200).json({ message: 'Tokens sent to your address' });
}