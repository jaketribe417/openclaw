import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { db, eq } from '@edt/db';
import { companies } from '@edt/db/schema';
import { UserRole } from '@edt/shared';

const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export async function companyRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // Get all companies (admin only)
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== UserRole.ADMIN) {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }
    
    const result = await db.select().from(companies);
    reply.send(result);
  });
  
  // Get company by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    // Users can only access their own company
    if (request.user.companyId !== id && request.user.role !== UserRole.ADMIN) {
      reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
      return;
    }
    
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    
    if (result.length === 0) {
      reply.code(404).send({ error: 'Not Found', message: 'Company not found' });
      return;
    }
    
    reply.send(result[0]);
  });
  
  // Create company (admin only)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== UserRole.ADMIN) {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }
    
    try {
      const body = createCompanySchema.parse(request.body);
      const [newCompany] = await db.insert(companies).values(body).returning();
      reply.code(201).send(newCompany);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Bad Request', message: error.errors });
      } else {
        throw error;
      }
    }
  });
  
  // Update company (admin only)
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== UserRole.ADMIN) {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }
    
    const { id } = request.params as { id: string };
    
    try {
      const body = updateCompanySchema.parse(request.body);
      const [updated] = await db.update(companies)
        .set(body)
        .where(eq(companies.id, id))
        .returning();
      
      if (!updated) {
        reply.code(404).send({ error: 'Not Found', message: 'Company not found' });
        return;
      }
      
      reply.send(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Bad Request', message: error.errors });
      } else {
        throw error;
      }
    }
  });
  
  // Delete company (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== UserRole.ADMIN) {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }
    
    const { id } = request.params as { id: string };
    await db.delete(companies).where(eq(companies.id, id));
    reply.code(204).send();
  });
}
