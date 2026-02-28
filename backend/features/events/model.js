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

//SHOULD WE COMBINE ALL INTO ONE FUNCTION AND JUST RUN EXTRA QUERY ACCORDING TO ROLE

export const getMemberEvents = async (teamId) => {
    try{
        const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2', [teamId, 'club']); //query to retrieve event by team ID from database
        return result.rows; //returning all events found with the specified team ID    
    }
    catch(err){
        console.error("Error retrieving member events:", err);
        throw err;
    }
}

//REVIEW LATER ACCORDING TO HOW WE STORE COACH TEAMS LIST
export const getCoachEvents = async (teamId) => {
    try{
        const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2 OR audience = $3', [teamId, 'club', 'coach']); //query to retrieve event by team ID from database
        return result.rows; 
    }
    catch(err){
        console.error("Error retrieving coach events:", err);
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
                [ category, title, venue, description, duration, event_date, status, audience, teamId, event.event_id]
            )
    }
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

export const getEvents = async (userRole, teamId) => {
    try{
        if(userRole === 'admin'){
            const result = await pool.query('SELECT * FROM events');
        } else if (userRole === 'coach') {
            const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2', [teamId, 'club']);
        } else {    
            const result = await pool.query('SELECT * FROM events WHERE team_id = $1 OR audience = $2', [teamId, 'club']);
        }

        return result.rows;
    }
        catch(err){
        console.error("Error retrieving events:", err);
        throw err;
    }
}