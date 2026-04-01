import pool from "../../config/db.js"; //importing database connection pool 

function normalizeIds(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((id) => id !== null && id !== undefined).map(Number);
    return [Number(value)];
}

export const getPLans = async (user) => {
    const user_role = user.user_role;
    const coachTeamIds = normalizeIds(user.coach_team_ids || user.team_ids || user.team_id);

    try{
        if(user_role === 'admin'){
            const result = await pool.query('SELECT * FROM session_plans'); //query to retrieve all session plans from database for admin users
            return result.rows;
        }else if(user_role === 'coach'){
            const result = await pool.query('SELECT * FROM session_plans WHERE team_id = ANY($1::int[])', [coachTeamIds]); //query to retrieve session plans for scoped coach teams
            return result.rows;
        }
        else {
            throw new Error("Invalid user role");
        }
    }    
    catch (err) {
        console.error("Error retrieving session plans:", err);
        throw err;
    }
}


//only coaches
export const createPlan = async (plan,user_id) => {
    try{
    const {title, description, team_id, warm_up,main_set,cool_down,coach_note } = plan;
    const created_by = user_id;
    const result = await pool.query(`INSERT INTO session_plans (title, description, team_id, warm_up, main_set, cool_down, coach_note, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [ title, description, team_id, warm_up, main_set, cool_down, coach_note, created_by]);
    return result.rows[0];
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
    const result = await pool.query(`UPDATE session_plans SET title=$1, description=$2, team_id=$3, warm_up=$4, main_set=$5, cool_down=$6, coach_note=$7 WHERE plan_id=$8 RETURNING *`,
        [ title, description, team_id, warm_up, main_set, cool_down, coach_note,plan_id]);
    return result.rows[0];
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

export const getPlanById = async (id) => {
    const result = await pool.query('SELECT * FROM session_plans WHERE plan_id = $1', [id]);
    return result.rows[0] || null;
}

