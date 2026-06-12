import { Contract, providers } from 'ethers';
import { ContractStorage } from '../contracts/ContractStorage.sol';
import { ClawChain } from '../ClawChain';

export async function fetchTokenContracts(): Promise<string[]> {
  // Fetch the list of deployed CRC-20 token contracts
  const contractStorage = new Contract(
    ContractStorage.address,
    ContractStorage.abi,
    providers.getDefaultProvider()
  );

  const tokenContractAddresses = await contractStorage.getTokenContractAddresses();
  return tokenContractAddresses;
}

export async function getTokenDetails(tokenAddress: string): Promise<{
  address: string;
  name: string;
  symbol: string;
  totalSupply: number;
  numHolders: number;
  recentTransfers: Array<{
    from: string;
    to: string;
    amount: number;
    timestamp: number;
  }>;
}> {
  // Fetch the details for the specified token contract
  const tokenContract = new Contract(tokenAddress, ContractStorage.TokenABI, providers.getDefaultProvider());

  const [name, symbol, totalSupply, numHolders, recentTransfers] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
    tokenContract.totalSupply(),
    tokenContract.numHolders(),
    fetchRecentTransfers(tokenAddress),
  ]);

  return {
    address: tokenAddress,
    name,
    symbol,
    totalSupply: totalSupply.toNumber(),
    numHolders: numHolders.toNumber(),
    recentTransfers,
  };
}

async function fetchRecentTransfers(tokenAddress: string): Promise<
  Array<{
    from: string;
    to: string;
    amount: number;
    timestamp: number;
  }>
> {
  // Fetch the recent transfer events for the specified token contract
  const clawChain = new ClawChain();
  const transfers = await clawChain.getTokenTransfers(tokenAddress, 10); // Fetch the 10 most recent transfers
  return transfers.map((transfer) => ({
    from: transfer.from,
    to: transfer.to,
    amount: transfer.amount,
    timestamp: transfer.timestamp,
  }));
}