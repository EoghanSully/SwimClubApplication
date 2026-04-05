import pool from "../../config/db.js"; //importing database connection pool 

export const getEvents = async (user_role, team_id) => { //for admins
    try{
        if(user_role === 'admin'){
            const result = await pool.query('SELECT * FROM events');
            return result.rows;
        } else if (user_role === 'coach') {
            const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2', [team_id, 'club']);
            return result.rows;
        } else {    
            const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2', [team_id, 'club']);
            return result.rows;
        }
    } catch (err) {
        console.error("Error retrieving events:", err);
        throw err;
    }
}


export const createEvent = async (event) => {
    try{
    const {category, title, venue, description,duration, event_date,status, audience,teamId } = event;
    const result = await pool.query(`INSERT INTO events (category, title, venue, description, duration, event_date, status, audience, team_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [ category, title, venue, description, duration, event_date, status, audience, teamId]);
    return result.rows;
    }
     catch(err){
        console.error("Error updating event:", err);
        throw err;
    }
}

export const UpdateEvent = async (event) => {
    try{
        const {category, title, venue, description,duration, event_date,status, audience,teamId } = event;
        const result = await pool.query('UPDATE events SET category=$1, title=$2, venue=$3, description=$4, duration=$5, event_date=$6, status=$7, audience=$8, team_id=$9 WHERE event_id=$10 RETURNING *',
            [ category, title, venue, description, duration, event_date, status, audience, teamId, event.event_id]            )
    
        return result.rows[0];}
    catch(err){
        console.error("Error updating event:", err);
        throw err;
    }
}

export const deleteEvent = async (id) => {
    try{
        const result = await pool.query("DELETE FROM events WHERE event_id=$1 RETURNING *", [id]);
         return result.rows[0];
    }
     catch(err){
        console.error("Error deleting event:", err);
        throw err;
    }
}

export const getPastEvents = async () => {
    try{
        const query = "SELECT u.first_name, u.last_name, attend.attended, e.title, e.category, e.event_date, e.event_id FROM users u JOIN event_attendance attend ON attend.user_id = u.user_id JOIN events e ON e.event_id = attend.event_id WHERE e.event_date < CURRENT_DATE";
        const result = await pool.query(query);
        return result.rows;
    }
    catch(err){
        console.error("Error retrieving events:", err);
        throw err;
    }
}

export const updateAttendance = async (event_id, user_id, attended) => {
    try {
        const result = await pool.query(
            `INSERT INTO event_attendance (event_id, user_id, attended) VALUES ($1, $2, $3)
             ON CONFLICT (event_id, user_id) DO UPDATE SET attended = EXCLUDED.attended
             RETURNING *`,
            [event_id, user_id, attended]
        );
        return result.rows[0];
    } catch (err) {
        console.error("Error upserting attendance:", err);
        throw err;
    }
};
