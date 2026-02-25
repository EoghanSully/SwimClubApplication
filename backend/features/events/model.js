import pool from "../../config/db.js"; //importing database connection pool 

export const getAllEvents = async () => { //for admins
    try{
        const result = await pool.query('SELECT * FROM events'); //query to retrieve all events from database   
        return result.rows;
    } catch (err) {
        console.error("Error retrieving events:", err);
        throw err;
    }
}

export const getMemberEvents = async (teamId) => {
    const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2', [teamId, 'club']); //query to retrieve event by team ID from database
    return result.rows; //returning all events found with the specified team ID    

}

export const getCoachEvents = async (teamId) => {
    const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2 OR audience = $3', [teamId, 'club', 'coach']); //query to retrieve event by team ID from database
    return result.rows; 

}

export const createEvent = async (event) => {
    const {event_title, event_type, venue, description,duration, event_date,audience,teamId } = event;
    const result = await pool.query(`INSERT INTO events (event_title, event_type, venue, description, duration, event_date, audience, team_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [event_title, event_type, venue, description, duration, event_date, audience, teamId]);
    return result.rows;
} 

export const deleteEvent = async (id) => {
    const result = await pool.query("DELETE FROM events WHERE event_id=$1 RETURNING *", [id]);
    return result.rows[0];
}