import axios from 'axios';
import { Block } from '../blockchain/block';

export const getBlocks = async (page: number = 1, limit: number = 10): Promise<Block[]> => {
  const response = await axios.get(`/api/blocks?page=${page}&limit=${limit}`);
  return response.data;
};

export const getBlockByHash = async (hash: string): Promise<Block> => {
  const response = await axios.get(`/api/blocks/${hash}`);
  return response.data;
};

export const getAddressBalance = async (address: string) => {
  const response = await axios.get(`/api/address/${address}/balance`);
  return response.data;
};

export const getAddressTransactions = async (address: string) => {
  const response = await axios.get(`/api/address/${address}/transactions`);
  return response.data;
};

export const getAddressTokens = async (address: string) => {
  const response = await axios.get(`/api/address/${address}/tokens`);
  return response.data;
};