import pool from "../../config/db.js"; //importing database connection pool 

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



export const deleteUser = async (id) => {
    const result = await pool.query("DELETE FROM users WHERE user_id=$1 RETURNING *", [id]);
    return result.rows[0];
}
