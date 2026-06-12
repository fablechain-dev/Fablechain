import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  fastify.get('/ready', async (request, reply) => {
    // Check if the node is fully initialized and ready to handle requests
    const isReady = await checkNodeReadiness();
    return { ready: isReady };
  });
}

async function checkNodeReadiness(): Promise<boolean> {
  // Implement logic to check if the node is ready to handle requests
  // This could involve checking the state of the blockchain, the database, etc.
  return true;
}