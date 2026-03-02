import pool from "../../config/db.js"; //importing database connection pool 
import argon2 from "argon2";

export const getAllUsers = async () => {
    try{
        const result = await pool.query('SELECT * FROM users'); //query to retrieve all users from database   
        return result.rows;
    } catch (err) {
        console.error("Error retrieving users:", err);
        throw err;
    }
}


export const getUserById = async (userId) => {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]); //query to retrieve user by ID from database
    return result.rows[0]; //returning the first (and only) user found with the specified ID    

}

export const createUser = async (user) => {
    let hash;
    try{
        hash = await argon2.hash(user.password); //hashing the user's password using argon2 for secure storage in the database
        const { first_name, last_name, email, phone, user_role } = user;
        const result = await pool.query("INSERT INTO users (first_name, last_name, email, phone, password_hash, user_role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [first_name, last_name, email, phone, hash, user_role]);
    return result.rows[0];

    } catch (err) {
        console.error("Error creating user:", err);
        throw err;
    }   
      
};

