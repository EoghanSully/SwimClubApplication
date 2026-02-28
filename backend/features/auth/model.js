import pool from "../../config/db.js"; //importing database connection pool 
import argon2 from "argon2";

export const getLoginCredentials = async (user) => {
    try{
        const { email,password_hash } = user;
        const result = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]); 
        if (result.rows.length === 0) {
            return null; // No user found with the provided credentials
        }
        const isPasswordValid = await argon2.verify(result.rows[0].password_hash, password_hash);
        if (!isPasswordValid) {
            return null; // Invalid password
        }
        return result.rows;
    } catch (err) {
        console.error("Error retrieving user login:", err);
        throw err;
    }
}


export const getUserById = async (userId) => {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]); //query to retrieve user by ID from database
    return result.rows[0]; //returning the first (and only) user found with the specified ID    

}

export const createUser = async (user) => {
    try{
        const { first_name, last_name, email, phone, password_hash, user_role } = user;
    const result = await pool.query(
        "INSERT INTO users (first_name, last_name, email, phone, password_hash, user_role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [first_name, last_name, email, phone, password_hash, user_role]);
    return result.rows[0];

    } catch (err) {
        console.error("Error creating user:", err);
        throw err;
    }   
      
};