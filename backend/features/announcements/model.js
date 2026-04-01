import pool from "../../config/db.js"; //importing database connection pool 

function normalizeIds(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((id) => id !== null && id !== undefined).map(Number);
    return [Number(value)];
}

export const getAnnouncements = async (user) => {
    const user_role = user.user_role;
    const scopedTeamIds = normalizeIds(user.user_role === 'coach' ? (user.coach_team_ids || user.team_ids || user.team_id) : (user.team_ids || user.team_id));

    try{
        let result;
        if(user_role === 'admin'){ 
            result = await pool.query('SELECT * FROM announcements'); // Admins can see all announcements
        } else if (user_role === 'coach' || user_role === 'member') {
            result = await pool.query(
                `SELECT * FROM announcements
                 WHERE audience = 'club'
                    OR team_id IS NULL
                    OR team_id = ANY($1::int[])`,
                [scopedTeamIds]
            );
        } else {
            throw new Error('Invalid user role');
        }
        
        return result.rows;
    }
        catch(err){
        console.error("Error retrieving announcements:", err);
        throw err;
    }
}

export const createAnnouncement = async (announcement) => {
    try{ 
        const {category,title, description, content, audience,admin_id,team_id, target } = announcement;
        const normalizedAudience = audience || (target === 'COACHES' ? 'coach' : (team_id ? 'team' : 'club'));
        const normalizedDescription = description ?? content ?? '';
         const result = await pool.query(`INSERT INTO announcements (category, title, description, audience, admin_id, team_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [category, title, normalizedDescription , normalizedAudience, admin_id, team_id || null]);
    return result.rows;
    } 
    catch (err) {
        console.error("Error creating announcement:", err);
        throw err;
    }
        
} 

export const editAnnouncement = async (announcement) => {
    try{
        const {announcement_id, category, title, description, content, audience, admin_id, team_id, target } = announcement;
        const normalizedAudience = audience || (target === 'COACHES' ? 'coach' : (team_id ? 'team' : 'club'));
        const normalizedDescription = description ?? content ?? '';
        const result = await pool.query(`UPDATE announcements SET category=$1, title=$2, description=$3, audience=$4, admin_id=$5, team_id=$6 WHERE announcement_id=$7 RETURNING *`,
        [category, title, normalizedDescription, normalizedAudience, admin_id, team_id || null, announcement_id]);
        return result.rows[0];
    } 
    catch (err) {
        console.error("Error editing announcement:", err);
        throw err;
    }
};

export const deleteAnnouncement = async (announcement_id) => {
    const result = await pool.query("DELETE FROM announcements WHERE announcement_id=$1 RETURNING *", [announcement_id]);
    return result.rows[0];
}

export const getAnnouncementById = async (announcement_id) => {
    const result = await pool.query('SELECT * FROM announcements WHERE announcement_id = $1', [announcement_id]);
    return result.rows[0] || null;
}