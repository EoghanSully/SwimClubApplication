import pool from "../../config/db.js"; //importing database connection pool 

export const getAnnouncements = async (user_role, team_id) => {
    try{
        let result;
        if(user_role === 'admin'){ 
            result = await pool.query('SELECT * FROM announcements'); // Admins can see all announcements
        } else if (user_role === 'coach') {
            result = await pool.query('SELECT * FROM announcements WHERE team_id = $1 OR audience = $2', [team_id, 'club']);
        } else if(user_role === 'member'){    
            result = await pool.query('SELECT * FROM announcements WHERE team_id = $1 OR audience = $2', [team_id, 'club']);
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
        const {category,title, description,audience,admin_id,team_id } = announcement;
         const result = await pool.query(`INSERT INTO announcements (category, title, description, audience, admin_id, team_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [category, title, description , audience, admin_id, team_id]);
    return result.rows[0];
    } 
    catch (err) {
        console.error("Error creating announcement:", err);
        throw err;
    }
        
} 

export const editAnnouncement = async (announcement) => {
    try{
        const {announcement_id, category, title, description, audience, admin_id, team_id } = announcement;
        const result = await pool.query(`UPDATE announcements SET category=$1, title=$2, description=$3, audience=$4, admin_id=$5, team_id=$6 WHERE announcement_id=$7 RETURNING *`,
        [category, title, description, audience, admin_id, team_id, announcement_id]);
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