import pkg from "pg"; //node.js modules for PostgreSQL database interaction 
import dotenv from "dotenv"; //to read variables from the .env file

const { Pool } = pkg;  
dotenv.config();
// Provide sensible defaults so the app still starts even if .env is missing.
// NOTE: You must still run PostgreSQL locally (or point these to a running instance).
const pool = new Pool({ //pool of connections for database access
  host: process.env.HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DATABASE || 'postgres',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export default pool;
