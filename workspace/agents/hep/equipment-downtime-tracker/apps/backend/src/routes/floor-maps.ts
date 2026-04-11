import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db, eq, and } from '@edt/db';
import { floorMaps } from '@edt/db/schema';

export async function floorMapRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get floor map by floor ID
  fastify.get('/floor/:floorId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { floorId } = request.params as { floorId: string };
    const result = await db.select().from(floorMaps).where(eq(floorMaps.floorId, floorId));
    reply.send(result[0] || null);
  });
  
  // Upload floor map (admin or supervisor)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    reply.code(501).send({ message: 'Not implemented yet - requires multipart upload to MinIO' });
  });
}
