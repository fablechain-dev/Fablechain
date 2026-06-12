interface FaucetRequest {
  address: string;
  timestamp: number;
}

const faucetRequests: FaucetRequest[] = [];

export const getFaucetRequestsByAddress = async (address: string): Promise<FaucetRequest[]> {
  return faucetRequests.filter(request => request.address === address);
};

export const addFaucetRequest = async (address: string): Promise<void> {
  faucetRequests.push({ address, timestamp: Date.now() });
};