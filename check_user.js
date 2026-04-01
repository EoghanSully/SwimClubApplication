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

async function checkUser() {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['j.milwaki1@club.ie']);
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    const user = result.rows[0];
    console.log('User found:', user);

    const isValid = await argon2.verify(user.password_hash, 'password123');
    console.log('Password valid:', isValid);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUser();