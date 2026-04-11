import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db, eq, and } from '@edt/db';
import { parts } from '@edt/db/schema';
import { UserRole } from '@edt/shared';

export async function partsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get all parts for company
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = await db.select().from(parts).where(eq(parts.companyId, request.user.companyId));
    reply.send(result);
  });
  
  // Create part (admin or supervisor)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR].includes(request.user.role as UserRole)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin or supervisor access required' });
      return;
    }
    reply.code(501).send({ message: 'Not implemented yet' });
  });
}
