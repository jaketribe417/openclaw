import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { db, eq, and } from '@edt/db';
import { downtimeEvents, workLogs, equipment, users, partsUsed } from '@edt/db/schema';
import { UserRole, DowntimeSeverity, DowntimeStatus } from '@edt/shared';

const reportIssueSchema = z.object({
  equipmentId: z.string().uuid(),
  moduleId: z.string().uuid().optional(),
  componentId: z.string().uuid().optional(),
  severity: z.enum(['critical', 'non_critical']),
  description: z.string().min(1).max(5000),
  photoUrl: z.string().url().optional(),
});

const acknowledgeEventSchema = z.object({
  eventId: z.string().uuid(),
});

const resolveEventSchema = z.object({
  eventId: z.string().uuid(),
});

export async function downtimeEventRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // Get all downtime events for company
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    
    const result = await db.select()
      .from(downtimeEvents)
      .where(eq(downtimeEvents.companyId, companyId))
      .orderBy(downtimeEvents.reportedAt);
    
    reply.send(result);
  });
  
  // Get open/pending events
  fastify.get('/open', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.user;
    
    const result = await db.select()
      .from(downtimeEvents)
      .where(and(
        eq(downtimeEvents.companyId, companyId),
        eq(downtimeEvents.status, 'reported')
      ))
      .orderBy(downtimeEvents.reportedAt);
    
    reply.send(result);
  });
  
  // Get event by ID with details
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { companyId } = request.user;
    
    const result = await db.select()
      .from(downtimeEvents)
      .where(and(eq(downtimeEvents.id, id), eq(downtimeEvents.companyId, companyId)))
      .limit(1);
    
    if (result.length === 0) {
      reply.code(404).send({ error: 'Not Found', message: 'Event not found' });
      return;
    }
    
    // Get work logs
    const logs = await db.select()
      .from(workLogs)
      .where(eq(workLogs.downtimeEventId, id));
    
    reply.send({
      ...result[0],
      workLogs: logs,
    });
  });
  
  // Report new issue (operators and above)
  fastify.post('/report', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const body = reportIssueSchema.parse(request.body);
      const { companyId, id: userId } = request.user;
      
      // Verify equipment belongs to user's company
      const equipmentResult = await db.select()
        .from(equipment)
        .where(and(eq(equipment.id, body.equipmentId), eq(equipment.companyId, companyId)))
        .limit(1);
      
      if (equipmentResult.length === 0) {
        reply.code(404).send({ error: 'Not Found', message: 'Equipment not found' });
        return;
      }
      
      // Create downtime event
      const [newEvent] = await db.insert(downtimeEvents).values({
        equipmentId: body.equipmentId,
        companyId,
        moduleId: body.moduleId,
        componentId: body.componentId,
        reportedBy: userId,
        severity: body.severity,
        description: body.description,
        photoUrl: body.photoUrl,
      }).returning();
      
      // If critical, update equipment status to down
      if (body.severity === 'critical') {
        await db.update(equipment)
          .set({ status: 'down' })
          .where(eq(equipment.id, body.equipmentId));
      }
      
      reply.code(201).send(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Bad Request', message: error.errors });
      } else {
        throw error;
      }
    }
  });
  
  // Acknowledge event (technicians and above)
  fastify.post('/acknowledge', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN].includes(request.user.role as UserRole)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Technician access required' });
      return;
    }
    
    const body = acknowledgeEventSchema.parse(request.body);
    const { companyId, id: userId } = request.user;
    
    const [updated] = await db.update(downtimeEvents)
      .set({
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      })
      .where(and(
        eq(downtimeEvents.id, body.eventId),
        eq(downtimeEvents.companyId, companyId)
      ))
      .returning();
    
    if (!updated) {
      reply.code(404).send({ error: 'Not Found', message: 'Event not found' });
      return;
    }
    
    reply.send(updated);
  });
  
  // Mark as in repair (technicians and above)
  fastify.post('/start-repair', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN].includes(request.user.role as UserRole)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Technician access required' });
      return;
    }
    
    const body = acknowledgeEventSchema.parse(request.body);
    const { companyId } = request.user;
    
    const [updated] = await db.update(downtimeEvents)
      .set({ status: 'in_repair' })
      .where(and(
        eq(downtimeEvents.id, body.eventId),
        eq(downtimeEvents.companyId, companyId)
      ))
      .returning();
    
    if (!updated) {
      reply.code(404).send({ error: 'Not Found', message: 'Event not found' });
      return;
    }
    
    reply.send(updated);
  });
  
  // Resolve event (technicians and above)
  fastify.post('/resolve', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TECHNICIAN].includes(request.user.role as UserRole)) {
      reply.code(403).send({ error: 'Forbidden', message: 'Technician access required' });
      return;
    }
    
    const body = resolveEventSchema.parse(request.body);
    const { companyId, id: userId } = request.user;
    
    const [updated] = await db.update(downtimeEvents)
      .set({
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date(),
      })
      .where(and(
        eq(downtimeEvents.id, body.eventId),
        eq(downtimeEvents.companyId, companyId)
      ))
      .returning();
    
    if (!updated) {
      reply.code(404).send({ error: 'Not Found', message: 'Event not found' });
      return;
    }
    
    // Update equipment status back to running
    await db.update(equipment)
      .set({ status: 'running' })
      .where(eq(equipment.id, updated.equipmentId));
    
    reply.send(updated);
  });
}
