import request from 'supertest';
import express from 'express';
import RateLimiter from '../rate-limiter';

describe('RateLimiter', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    const rateLimiter = new RateLimiter();
    app.use(rateLimiter.middleware);

    app.post('/test', (req, res) => {
      res.status(200).json({ message: 'Success' });
    });
  });

  it('should allow legitimate requests', async () => {
    const response = await request(app)
      .post('/test')
      .set('X-API-Key', 'valid-key')
      .expect(200);
    expect(response.body.message).toBe('Success');
  });

  it('should rate limit excessive requests', async () => {
    for (let i = 0; i < 101; i++) {
      await request(app)
        .post('/test')
        .set('X-API-Key', 'valid-key')
        .expect(i < 100 ? 200 : 429);
    }
  });

  it('should track requests by IP and API key', async () => {
    await request(app)
      .post('/test')
      .set('X-API-Key', 'valid-key')
      .set('X-Forwarded-For', '1.2.3.4')
      .expect(200);

    await request(app)
      .post('/test')
      .set('X-API-Key', 'valid-key')
      .set('X-Forwarded-For', '5.6.7.8')
      .expect(200);

    await request(app)
      .post('/test')
      .set('X-API-Key', 'another-key')
      .set('X-Forwarded-For', '1.2.3.4')
      .expect(200);

    await request(app)
      .post('/test')
      .set('X-API-Key', 'valid-key')
      .set('X-Forwarded-For', '1.2.3.4')
      .expect(429);
  });
});