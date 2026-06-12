import { FastifyInstance } from 'fastify';

export async function registerHealthCheckRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    // Check node health
    const isHealthy = await checkNodeHealth();

    reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'healthy' : 'unhealthy',
    });
  });

  fastify.get('/ready', async (request, reply) => {
    // Check node readiness
    const isReady = await checkNodeReadiness();

    reply.status(isReady ? 200 : 503).send({
      status: isReady ? 'ready' : 'not ready',
    });
  });
}

async function checkNodeHealth(): Promise<boolean> {
  // Implement node health checks here
  // e.g., check database connection, memory usage, etc.
  return true;
}

async function checkNodeReadiness(): Promise<boolean> {
  // Implement node readiness checks here
  // e.g., check if blockchain is fully synced, etc.
  return true;
}

// Register the health check routes
export default async function registerApiRoutes(fastify: FastifyInstance) {
  await registerHealthCheckRoutes(fastify);
}