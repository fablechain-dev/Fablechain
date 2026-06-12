import { Block } from '../models/Block';

export const getBlocks = async (): Promise<Block[]> => {
  // TODO: Implement API call to fetch all blocks
  return [
    {
      hash: '0x123abc',
      height: 1,
      timestamp: new Date().getTime(),
      transactions: [
        { id: '0x1', from: '0xabc', to: '0xdef', amount: 100 },
        { id: '0x2', from: '0xdef', to: '0xabc', amount: 50 }
      ]
    },
    {
      hash: '0x456def',
      height: 2,
      timestamp: new Date().getTime() - 60000,
      transactions: [
        { id: '0x3', from: '0xghi', to: '0xjkl', amount: 75 }
      ]
    }
  ];
};