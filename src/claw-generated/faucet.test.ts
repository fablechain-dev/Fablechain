import request from 'supertest';
import express from 'express';
import { faucetEndpoint } from './faucet';
import { Account } from '../models/Account';
import { Token } from '../models/Token';

const app = express();
app.use(express.json());
app.post('/faucet', faucetEndpoint);

describe('Faucet Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should dispense 10 CLAW tokens', async () => {
    const address = '0x1234567890abcdef';
    const response = await request(app).post('/faucet').send({ address });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tokens dispensed successfully');
    expect(Token.mint).toHaveBeenCalledWith(address, 10);
  });

  it('should not dispense tokens more than once per day', async () => {
    const address = '0x1234567890abcdef';
    jest.spyOn(Account, 'findOne').mockResolvedValue({ address, lastDispensed: new Date() });

    const response = await request(app).post('/faucet').send({ address });

    expect(response.status).toBe(429);
    expect(response.body.error).toBe('You can only claim tokens once per day');
    expect(Token.mint).not.toHaveBeenCalled();
  });
});