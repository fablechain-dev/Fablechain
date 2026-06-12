import request from 'supertest';
import express from 'express';
import RateLimiter from '../rate-limiter';

describe('RateLimiter', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    const rateLimiter = new RateLimiter();
    app.use(rateLimiter.middleware);

    app.get('/test', (req, res) => {
      res.send('OK');
    });
  });

  it('should limit requests', async () => {
    // Make 101 requests
    for (let i = 0; i < 101; i++) {
      const response = await request(app).get('/test');
      if (i < 100) {
        expect(response.status).toEqual(200);
      } else {
        expect(response.status).toEqual(429);
        expect(response.body).toEqual({ error: 'Too many requests' });
      }
    }
  });

  it('should reset the counter after the window expires', async () => {
    // Make 100 requests
    for (let i = 0; i < 100; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toEqual(200);
    }

    // Wait for the window to expire
    await new Promise((resolve) => setTimeout(resolve, 61000));

    // Make another 100 requests
    for (let i = 0; i < 100; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toEqual(200);
    }
  });
});