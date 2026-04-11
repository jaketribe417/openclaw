import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db, eq, and } from '@edt/db';
import { buildings, floors } from '@edt/db/schema';
import { UserRole } from '@edt/shared';

export async function buildingRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = await db.select().from(buildings).where(eq(buildings.companyId, request.user.companyId));
    reply.send(result);
  });
}

export async function floorRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = await db.select().from(floors);
    reply.send(result);
  });
}

export async function zoneRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { zones } = await import('@edt/db/schema.js');
    const result = await db.select().from(zones).where(eq(zones.companyId, request.user.companyId));
    reply.send(result);
  });
}
