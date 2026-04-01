import pool from "../../config/db.js"; //importing database connection pool 
import argon2 from "argon2";

export const getLoginCredentials = async (user) => {
    try{
        const { email, password } = user;
        if (!email || !password) {
            return null;
        }
        const query = `
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.password_hash,
                u.user_role,
                COALESCE(array_agg(DISTINCT tm.team_id) FILTER (WHERE tm.team_id IS NOT NULL), '{}') AS team_ids,
                COALESCE(array_agg(DISTINCT ct.team_id) FILTER (WHERE ct.team_id IS NOT NULL), '{}') AS coach_team_ids
            FROM users u
            LEFT JOIN team_members tm ON tm.user_id = u.user_id
            LEFT JOIN teams ct ON ct.coach_id = u.user_id
            WHERE u.email = $1
            GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.password_hash, u.user_role
        `;
        const result = await pool.query(query, [email]); 
        if (result.rows.length === 0) {
            return null; // No user found with the provided credentials
        }
        const storedHash = result.rows[0].password_hash;
        if (typeof storedHash !== 'string' || !storedHash.startsWith('$argon2')) {
            return null;
        }

        let isUserValid = false;
        try {
            isUserValid = await argon2.verify(storedHash, password); // verifies the provided password against the stored hash using argon2
        } catch (_) {
            return null;
        }

        if (!isUserValid) {
            return null; // Invalid password
        }
        return result.rows; //returns user information if login is successful
    } catch (err) {
        console.error("Error retrieving user login:", err);
        throw err;
    }
}


