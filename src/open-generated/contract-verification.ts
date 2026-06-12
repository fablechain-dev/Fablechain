import axios from 'axios';

export async function verifyContract(sourceCode: string): Promise<{ status: 'valid' | 'invalid'; issues?: string[] }> {
  try {
    const response = await axios.post('/api/verify-contract', { sourceCode });
    return response.data;
  } catch (error) {
    console.error('Error verifying contract:', error);
    return { status: 'invalid', issues: ['Error occurred during verification'] };
  }
}