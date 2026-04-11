import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth.js';
import { companyRoutes } from './routes/companies.js';
import { buildingRoutes } from './routes/buildings.js';
import { floorRoutes } from './routes/floors.js';
import { zoneRoutes } from './routes/zones.js';
import { equipmentRoutes } from './routes/equipment.js';
import { moduleRoutes } from './routes/modules.js';
import { componentRoutes } from './routes/components.js';
import { downtimeEventRoutes } from './routes/downtime-events.js';
import { workLogRoutes } from './routes/work-logs.js';
import { partsRoutes } from './routes/parts.js';
import { reportRoutes } from './routes/reports.js';
import { floorMapRoutes } from './routes/floor-maps.js';
import { sseRoutes } from './routes/sse.js';

import { authenticate } from './plugins/authenticate.js';
import { companyContext } from './plugins/company-context.js';

// Load environment variables
dotenv.config({ path: '../../infrastructure/.env' });

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    } : undefined,
  },
});

// Register plugins
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});

await app.register(multipart);

// Swagger documentation
await app.register(swagger, {
  openapi: {
    info: {
      title: 'Equipment Downtime Tracker API',
      description: 'API for tracking equipment downtime and maintenance',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/documentation',
});

// Custom plugins
await app.register(authenticate);
await app.register(companyContext);

// Register routes
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(companyRoutes, { prefix: '/api/companies' });
await app.register(buildingRoutes, { prefix: '/api/buildings' });
await app.register(floorRoutes, { prefix: '/api/floors' });
await app.register(zoneRoutes, { prefix: '/api/zones' });
await app.register(equipmentRoutes, { prefix: '/api/equipment' });
await app.register(moduleRoutes, { prefix: '/api/modules' });
await app.register(componentRoutes, { prefix: '/api/components' });
await app.register(downtimeEventRoutes, { prefix: '/api/downtime-events' });
await app.register(workLogRoutes, { prefix: '/api/work-logs' });
await app.register(partsRoutes, { prefix: '/api/parts' });
await app.register(reportRoutes, { prefix: '/api/reports' });
await app.register(floorMapRoutes, { prefix: '/api/floor-maps' });
await app.register(sseRoutes, { prefix: '/api/sse' });

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  
  if (error.validation) {
    reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message,
    });
  } else {
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: error.message,
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.APP_PORT || '3001');
    const host = process.env.APP_HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    app.log.info(`🚀 Server running at http://${host}:${port}`);
    app.log.info(`📚 API Documentation at http://${host}:${port}/documentation`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, closing server...');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  app.log.info('SIGINT received, closing server...');
  await app.close();
  process.exit(0);
});
