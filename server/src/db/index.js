import pg from 'pg'

const { Pool } = pg

// Singleton pool instance - reused across all database queries
// to avoid creating a new connection on every request
let pool

export function getPool() {
  // Only create the pool once - if it already exists, return the existing instance
  if (!pool) {
    pool = new Pool({
      // TODO: replace hardcoded credentials with environment variables
      // Credentials are hardcoded temporarily due to an ES module timing issue
      // where dotenv loads after the pool is created - will use Railway environment
      // variables in production so credentials are never exposed in source code
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.fbjnraikostjdhvgrbfa',
      password: 'GridChampUni',
      // SSL required for Supabase connections
      ssl: { rejectUnauthorized: false },
      // Keep connections alive to prevent timeouts on idle connections
      keepAlive: true,
      // Timeout after 10 seconds if a connection cannot be established
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}