import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { db, eq, and } from '@edt/db';
import { equipment, zones, modules, components, downtimeEvents } from '@edt/db/schema';
import { UserRole, EquipmentStatus, type Equipment } from '@edt/shared';

// Schema for creating equipment
const createEquipmentSchema = z.object({
  zoneId: z.string().uuid(),
  name: z.string().min(1).max(255),
  equipmentId: z.string().min(1).max(100),
  type: z.enum(['printer', 'inserter', 'jet', 'finisher', 'other']),
  photoUrl: z.string().url().optional(),
  floorMapX: z.number().optional(),
  floorMapY: z.number().optional(),
});

// Schema for updating status
const updateStatusSchema = z.object({
  status: z.enum(['running', 'degraded', 'down']),
  reason: z.string().optional(),
});

export async function equipmentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // Get all equipment for user's company
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    
    const result = await db.select().from(equipment).where(eq(equipment.companyId, companyId));
    reply.send(result);
  });
  
  // Get equipment by ID with related data
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { companyId } = request.user;
    
    const result = await db.select()
      .from(equipment)
      .where(and(eq(equipment.id, id), eq(equipment.companyId, companyId)))
      .limit(1);
    
    if (result.length === 0) {
      reply.code(404).send({ error: 'Not Found', message: 'Equipment not found' });
      return;
    }
    
    // Get modules for this equipment
    const modulesResult = await db.select()
      .from(modules)
      .where(eq(modules.equipmentId, id));
    
    reply.send({
      ...result[0],
      modules: modulesResult,
    });
  });
  
  // Create equipment (admin or supervisor)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR].includes(request.user.role as UserRole)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin or supervisor access required' });
      return;
    }
    
    try {
      const body = createEquipmentSchema.parse(request.body);
      
      const [newEquipment] = await db.insert(equipment).values({
        ...body,
        companyId: request.user.companyId,
      }).returning();
      
      reply.code(201).send(newEquipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Bad Request', message: error.errors });
      } else {
        throw error;
      }
    }
  });
  
  // Update equipment status
  fastify.patch('/:id/status', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { companyId, role, id: userId } = request.user;
    
    // Technicians and above can update status
    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN].includes(role as UserRole)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Technician access required' });
      return;
    }
    
    try {
      const body = updateStatusSchema.parse(request.body);
      
      // Get current equipment status
      const current = await db.select()
        .from(equipment)
        .where(and(eq(equipment.id, id), eq(equipment.companyId, companyId)))
        .limit(1);
      
      if (current.length === 0) {
        reply.code(404).send({ error: 'Not Found', message: 'Equipment not found' });
        return;
      }
      
      // Update status - triggers will handle status_history logging
      const [updated] = await db.update(equipment)
        .set({ 
          status: body.status,
          updatedAt: new Date(),
        })
        .where(and(eq(equipment.id, id), eq(equipment.companyId, companyId)))
        .returning();
      
      // Broadcast status change via SSE (will implement)
      
      reply.send(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Bad Request', message: error.errors });
      } else {
        throw error;
      }
    }
  });
  
  // Get equipment with open downtime events
  fastify.get('/:id/downtime-events', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { companyId } = request.user;
    
    const result = await db.select()
      .from(downtimeEvents)
      .where(and(
        eq(downtimeEvents.equipmentId, id),
        eq(downtimeEvents.companyId, companyId)
      ));
    
    reply.send(result);
  });
  
  // Delete equipment (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (request.user.role !== UserRole.ADMIN) {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
      return;
    }
    
    const { id } = request.params as { id: string };
    await db.delete(equipment).where(eq(equipment.id, id));
    reply.code(204).send();
  });
}
