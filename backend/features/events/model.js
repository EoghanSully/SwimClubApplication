import pool from "../../config/db.js"; //importing database connection pool 

function normalizeIds(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((id) => id !== null && id !== undefined).map(Number);
    return [Number(value)];
}

export const getEvents = async (user) => {
    const user_role = user.user_role;
    const memberTeamIds = normalizeIds(user.team_ids || user.team_id);
    const coachTeamIds = normalizeIds(user.coach_team_ids);
    const scopedTeamIds = user_role === 'coach' ? (coachTeamIds.length ? coachTeamIds : memberTeamIds) : memberTeamIds;

    try{
        if(user_role === 'admin'){
            const result = await pool.query('SELECT * FROM events');
            return result.rows;
        }

        const result = await pool.query(
            `SELECT * FROM events
             WHERE audience = 'club'
                OR team_id IS NULL
                OR team_id = ANY($1::int[])`,
            [scopedTeamIds]
        );

        return result.rows;
    } catch (err) {
        console.error("Error retrieving events:", err);
        throw err;
    }
}

export const getEventById = async (event_id) => {
    const result = await pool.query('SELECT * FROM events WHERE event_id = $1', [event_id]);
    return result.rows[0] || null;
}

export const createEvent = async (event) => {
    try{
    const {category, title, venue, description,duration, event_date,status, audience, team_id, teamId } = event;
    const normalizedTeamId = team_id ?? teamId ?? null;
    const result = await pool.query(`INSERT INTO events (category, title, venue, description, duration, event_date, status, audience, team_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [ category, title, venue, description, duration, event_date, status, audience, normalizedTeamId]);
    return result.rows;
    }
     catch(err){
        console.error("Error updating event:", err);
        throw err;
    }
}

export const UpdateEvent = async (event) => {
    try{
        const {category, title, venue, description,duration, event_date,status, audience, team_id, teamId } = event;
        const normalizedTeamId = team_id ?? teamId ?? null;
        const result = await pool.query('UPDATE events SET category=$1, title=$2, venue=$3, description=$4, duration=$5, event_date=$6, status=$7, audience=$8, team_id=$9 WHERE event_id=$10 RETURNING *',
            [ category, title, venue, description, duration, event_date, status, audience, normalizedTeamId, event.event_id]            )

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
    } catch (err) {
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

export const getEventAttendance = async (event_id) => {
    const event = await getEventById(event_id);
    if (!event) return [];

    if (event.team_id) {
        const teamQuery = `
            SELECT u.user_id, u.first_name, u.last_name, COALESCE(a.attended, false) AS attended
            FROM team_members tm
            JOIN users u ON u.user_id = tm.user_id
            LEFT JOIN event_attendance a ON a.user_id = u.user_id AND a.event_id = $1
            WHERE tm.team_id = $2
            ORDER BY u.last_name, u.first_name
        `;
        const teamResult = await pool.query(teamQuery, [event_id, event.team_id]);
        return teamResult.rows;
    }

    const clubQuery = `
        SELECT u.user_id, u.first_name, u.last_name, COALESCE(a.attended, false) AS attended
        FROM users u
        LEFT JOIN event_attendance a ON a.user_id = u.user_id AND a.event_id = $1
        WHERE u.user_role IN ('member', 'coach')
        ORDER BY u.last_name, u.first_name
    `;
    const clubResult = await pool.query(clubQuery, [event_id]);
    return clubResult.rows;
}

export const upsertAttendance = async (event_id, user_id, attended) => {
    const updateQuery = `
        UPDATE event_attendance
        SET attended = $3
        WHERE event_id = $1 AND user_id = $2
        RETURNING *
    `;
    const updated = await pool.query(updateQuery, [event_id, user_id, attended]);
    if (updated.rows[0]) return updated.rows[0];

    const insertQuery = `
        INSERT INTO event_attendance (event_id, user_id, attended)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const inserted = await pool.query(insertQuery, [event_id, user_id, attended]);
    return inserted.rows[0] || null;
}