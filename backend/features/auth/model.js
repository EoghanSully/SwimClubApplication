import pool from "../../config/db.js"; //importing database connection pool 
import argon2 from "argon2";

export const getLoginCredentials = async (user) => {
    try{
        const { email, password } = user;
        const query = 'SELECT u.user_id, u.password_hash, u.user_role, u.first_name, u.last_name, u.email, t.team_id FROM users u LEFT JOIN team_members t ON t.user_id = u.user_id WHERE u.email = $1';
        const result = await pool.query(query, [email]); 
        if (result.rows.length === 0) {
            return null; // No user found with the provided credentials
        }
        const isUserValid = await argon2.verify(result.rows[0].password_hash, password); //verifies the provided password against the stored hash using argon2
        if (!isUserValid) {
            return null; // Invalid password
        }
        return result.rows; //returns user information if login is successful
    } catch (err) {
        console.error("Error retrieving user login:", err);
        throw err;
    }
}


