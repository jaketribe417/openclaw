import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

// Store connected clients
const clients = new Map<string, any>();

export async function sseRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // SSE endpoint for real-time updates
  fastify.get('/:companyId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { companyId } = request.params as { companyId: string };
    
    // Validate user belongs to this company
    if (request.user.companyId !== companyId) {
      reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
      return;
    }
    
    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    
    // Send initial connection message
    reply.raw.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
    
    // Store client connection
    const clientId = `${companyId}-${Date.now()}`;
    clients.set(clientId, { reply, companyId });
    
    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      reply.raw.write(`:heartbeat\n\n`);
    }, 30000);
    
    // Handle disconnect
    request.raw.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(clientId);
      fastify.log.info(`SSE client disconnected: ${clientId}`);
    });
  });
  
  // Broadcast function (to be called from other routes)
  fastify.decorate('broadcastToCompany', (companyId: string, data: any) => {
    clients.forEach((client, clientId) => {
      if (client.companyId === companyId) {
        try {
          client.reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (err) {
          fastify.log.error(`Failed to send SSE to ${clientId}:`, err);
          clients.delete(clientId);
        }
      }
    });
  });
}

// Export function to broadcast events
export function broadcastEvent(companyId: string, event: any) {
  // This will be called from other modules
  console.log(`Broadcasting to company ${companyId}:`, event);
}
