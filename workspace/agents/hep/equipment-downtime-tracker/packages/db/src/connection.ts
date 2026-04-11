import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://edt_admin:changeme_in_production@localhost:5432/equipment_downtime_tracker',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Connection pool for raw queries
export { pool };

// Helper to set tenant context for RLS
export async function setTenantContext(companyId: string, userId?: string) {
  const client = await pool.connect();
  try {
    await client.query(`SET LOCAL app.current_company_id = '${companyId}'`);
    if (userId) {
      await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
    }
    return client;
  } catch (error) {
    client.release();
    throw error;
  }
}

// Helper to clear tenant context
export async function clearTenantContext(client: any) {
  try {
    await client.query('SET LOCAL app.current_company_id = NULL');
    await client.query('SET LOCAL app.current_user_id = NULL');
  } finally {
    client.release();
  }
}

// Transaction helper with tenant context
export async function withTenantTransaction<T>(
  companyId: string,
  userId: string | undefined,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set context for RLS
    await tx.execute(`SET LOCAL app.current_company_id = '${companyId}'`);
    if (userId) {
      await tx.execute(`SET LOCAL app.current_user_id = '${userId}'`);
    }
    
    const result = await callback(tx as unknown as typeof db);
    return result;
  });
}
