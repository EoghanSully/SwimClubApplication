import pkg from "pg"; //node.js modules for PostgreSQL database interaction 
import dotenv from "dotenv"; //to read variables from the .env file

const { Pool } = pkg;  
dotenv.config();
const pool = new Pool({ //pool of connection, to be used when we connect to database
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
}); 

export default pool;
