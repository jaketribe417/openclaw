import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db, eq, and } from '@edt/db';
import { workLogs, partsUsed, parts } from '@edt/db/schema';
import { UserRole } from '@edt/shared';

export async function workLogRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get work logs for a downtime event
  fastify.get('/event/:eventId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const result = await db.select().from(workLogs).where(eq(workLogs.downtimeEventId, eventId));
    reply.send(result);
  });
  
  // Create work log (technician and above)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN].includes(request.user.role as UserRole)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Technician access required' });
      return;
    }
    reply.code(501).send({ message: 'Not implemented yet' });
  });
}
