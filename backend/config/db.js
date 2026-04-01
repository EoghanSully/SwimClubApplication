import pkg from "pg"; //node.js modules for PostgreSQL database interaction 
import dotenv from "dotenv"; //to read variables from the .env file

const { Pool } = pkg;  
dotenv.config();
// Provide sensible defaults so the app still starts even if .env is missing.
// NOTE: You must still run PostgreSQL locally (or point these to a running instance).
const dbName = process.env.DB_NAME || process.env.DATABASE || 'postgres';
const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const host = process.env.HOST || 'localhost';
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || '';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

const poolConfig = {
  // pool of connections for database access
  host,
  user,
  password,
  database: dbName,
  port,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
};

if (useSsl) {
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const encodedDbName = encodeURIComponent(dbName);
  poolConfig.connectionString = process.env.DATABASE_URL || `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${encodedDbName}?sslmode=require`;
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export default pool;
