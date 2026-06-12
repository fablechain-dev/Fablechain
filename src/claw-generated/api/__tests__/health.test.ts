import request from 'supertest';
import app from '../index';

describe('Health Endpoints', () => {
  it('should return 200 OK for /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK' });
  });

  it('should return 200 OK for /ready when node is ready', async () => {
    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ready: true });
  });

  it('should return 503 Service Unavailable for /ready when node is not ready', async () => {
    // Mock the readiness check to return false
    jest.spyOn(app, 'isReady').mockReturnValue(false);
    const response = await request(app).get('/ready');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ ready: false });
  });
});