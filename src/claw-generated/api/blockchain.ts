import axios from 'axios';

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