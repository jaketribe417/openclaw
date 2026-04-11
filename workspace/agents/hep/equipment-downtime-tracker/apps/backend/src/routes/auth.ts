import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, eq, and } from '@edt/db';
import { users } from '@edt/db/schema';
import { UserRole } from '@edt/shared';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['admin', 'supervisor', 'technician', 'operator']),
});

export async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // Login endpoint
  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      
      // Find user by email
      const userResult = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      const user = userResult[0];
      
      if (!user || !user.active) {
        reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
        return;
      }
      
      // Verify password
      const isValid = await bcrypt.compare(body.password, user.passwordHash);
      if (!isValid) {
        reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
        return;
      }
      
      // Generate JWT token
      const token = await reply.jwtSign({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      });
      
      reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
        });
      } else {
        throw error;
      }
    }
  });
  
  // Register endpoint (admin only)
  fastify.post('/register', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      // Check if user is admin
      if (request.user.role !== UserRole.ADMIN) {
        reply.code(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Only administrators can register new users',
        });
        return;
      }
      
      const body = registerSchema.parse(request.body);
      
      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      if (existingUser.length > 0) {
        reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'User with this email already exists',
        });
        return;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      // Create user
      const [newUser] = await db.insert(users).values({
        companyId: body.companyId,
        email: body.email,
        passwordHash: hashedPassword,
        name: body.name,
        role: body.role,
        active: true,
      }).returning();
      
      reply.code(201).send({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        companyId: newUser.companyId,
        createdAt: newUser.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
        });
      } else {
        throw error;
      }
    }
  });
  
  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userResult = await db.select().from(users).where(eq(users.id, request.user.id)).limit(1);
    const user = userResult[0];
    
    if (!user) {
      reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }
    
    reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      active: user.active,
    });
  });
  
  // Password reset request
  fastify.post('/password-reset-request', async (request, reply) => {
    const body = z.object({ email: z.string().email() }).parse(request.body);
    
    // In a real app, send email with reset token
    // For now, just acknowledge
    reply.send({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  });
}
