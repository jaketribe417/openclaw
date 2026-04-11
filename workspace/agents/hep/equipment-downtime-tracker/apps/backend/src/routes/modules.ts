import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db, eq, and } from '@edt/db';
import { modules, components } from '@edt/db/schema';
import { UserRole } from '@edt/shared';

export async function moduleRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/equipment/:equipmentId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { equipmentId } = request.params as { equipmentId: string };
    const result = await db.select().from(modules).where(eq(modules.equipmentId, equipmentId));
    reply.send(result);
  });
}

export async function componentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/module/:moduleId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { moduleId } = request.params as { moduleId: string };
    const result = await db.select().from(components).where(eq(components.moduleId, moduleId));
    reply.send(result);
  });
}
