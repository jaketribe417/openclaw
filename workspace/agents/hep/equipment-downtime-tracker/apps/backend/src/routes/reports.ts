import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db } from '@edt/db';

export async function reportRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // MTTR Report
  fastify.get('/mttr', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { companyId } = request.user;
    // Query vw_mttr view via raw SQL
    const result = await db.execute(`
      SELECT * FROM vw_mttr WHERE company_id = '${companyId}'
    `);
    reply.send(result.rows);
  });
  
  // Equipment downtime summary
  fastify.get('/downtime-summary', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { companyId } = request.user;
    const result = await db.execute(`
      SELECT * FROM vw_equipment_downtime_summary WHERE company_id = '${companyId}'
    `);
    reply.send(result.rows);
  });
  
  // Technician performance
  fastify.get('/technician-performance', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { companyId } = request.user;
    const result = await db.execute(`
      SELECT * FROM vw_technician_performance WHERE company_id = '${companyId}'
    `);
    reply.send(result.rows);
  });
  
  // Current status dashboard
  fastify.get('/current-status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { companyId } = request.user;
    const result = await db.execute(`
      SELECT * FROM vw_current_status WHERE company_id = '${companyId}'
    `);
    reply.send(result.rows[0]);
  });
}
