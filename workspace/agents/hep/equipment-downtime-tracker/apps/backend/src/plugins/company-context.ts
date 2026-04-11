import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    companyContext: {
      companyId: string;
      userId?: string;
    };
  }
}

export default fp(async function (fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    // Set company context from JWT if available
    if (request.user) {
      request.companyContext = {
        companyId: request.user.companyId,
        userId: request.user.id,
      };
    } else {
      request.companyContext = {
        companyId: '',
        userId: '',
      };
    }
  });
});

export { };
