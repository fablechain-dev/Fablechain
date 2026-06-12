import axios from 'axios';

export async function getTokenData() {
  const response = await axios.get('/api/tokens');
  return response.data;
}