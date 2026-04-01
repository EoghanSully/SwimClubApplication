import argon2 from 'argon2';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'Thoughts1',
  database: 'swimclub',
  port: 5432,
});

async function createUser() {
  try {
    const hash = await argon2.hash('password123');
    console.log('Password hash:', hash);

    const result = await pool.query(`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, user_role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, ['John', 'Milwaki', 'j.milwaki1@club.ie', '1234567890', hash, 'member']);

    console.log('User created:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createUser();