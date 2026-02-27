import pool from "../../config/db.js"; //importing database connection pool 


export const getAllPLans = async () => { //for all users, including members
    try{
        const result = await pool.query('SELECT * FROM session_plans'); //query to retrieve all session plans from database   
        return result.rows;
    } catch (err) {
        console.error("Error retrieving session plans:", err);
        throw err;
    }
}
export const getPlanByTeamId = async (teamId) => {
    const result = await pool.query('SELECT * FROM session_plans WHERE team_id = $1', [teamId]); //query to retrieve session plan by team ID from database
    return result.rows;
}

//only coaches
export const createPlan = async (plan,user_id) => {
    try{
    const {title, description, team_id, warm_up,main_set,cool_down,coach_note } = plan;
    const created_by = user_id;
    const result = await pool.query(`INSERT INTO session_plans (title, description, team_id, warm_up, main_set, cool_down, coach_note, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [ title, description, team_id, warm_up, main_set, cool_down, coach_note, created_by]);
    return result.rows;
    }
     catch(err){
        console.error("Error creating session plan:", err);
        throw err;
    }
}

//only coaches 
export const updatePlan = async (plan) => {
    try{
    const {plan_id,title, description, team_id, warm_up,main_set,cool_down,coach_note } = plan;
    const created_by = user_id;
    const result = await pool.query(`UPDATE session_plans SET title=$1, description=$2, team_id=$3, warm_up=$4, main_set=$5, cool_down=$6, coach_note=$7 WHERE plan_id=$8 RETURNING *`,
        [ title, description, team_id, warm_up, main_set, cool_down, coach_note,plan_id]);
    return result.rows;
    }
     catch(err){
        console.error("Error updating session plan:", err);
        throw err;
    }
}

export const deletePlan = async (id) => {
    try{
        const result = await pool.query("DELETE FROM session_plans WHERE plan_id=$1 RETURNING *", [id]);
         return result.rows[0];
    }
     catch(err){
        console.error("Error deleting session plan:", err);
        throw err;
    }
}

