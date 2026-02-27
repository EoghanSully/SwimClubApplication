import pool from "../../config/db.js"; //importing database connection pool 

export const getTeams = async (user_role,coach_id) => { //for admins and coaches
    try{
        //very long query, putting in a const to make it more readable
        if(user_role === "admin"){
                const query_string = "SELECT t.team_id,t.team_name,u.user_id,u.first_name,u.last_name FROM teams t JOIN team_members tm ON tm.team_id = t.team_id JOIN users u ON u.user_id = tm.user_id ORDER BY t.team_name, u.last_name, u.first_name;";
        } else if(user_role === "coach"){
                const query_string = "SELECT t.team_id,t.team_name,u.user_id,u.first_name,u.last_name FROM teams t JOIN team_members tm ON tm.team_id = t.team_id JOIN users u ON u.user_id = tm.user_id WHERE t.coach_id = $1 ORDER BY t.team_name, u.last_name, u.first_name;";
        }
        const result = await pool.query(query_string, [coach_id]); //query to retrieve all teams from database   
        return result.rows;
    } catch (err) {
        console.error("Error retrieving teams:", err);
        throw err;
    }
}

export const addMember = async (team_id,user_id) => {
    const result = await pool.query("INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) RETURNING *", [team_id, user_id]);
    return result.rows[0];
}

export const moveMember = async (team_id,user_id) => {
    const result = await pool.query("UPDATE team_members SET team_id = $1 WHERE user_id = $2 RETURNING *", [team_id, user_id]);
    return result.rows[0];
}
