import { Request, Response } from 'express';
import { getContractBytecode, verifyContractSource } from '../services/contract-verification';

export const contractVerificationHandler = async (req: Request, res: Response) => {
  const { contractAddress, contractSource } = req.body;

  try {
    const deployedBytecode = await getContractBytecode(contractAddress);
    const verificationResult = await verifyContractSource(contractSource, deployedBytecode);
    res.json(verificationResult);
  } catch (error) {
    console.error('Error verifying contract:', error);
    res.status(500).json({ error: 'Error verifying contract' });
  }
};