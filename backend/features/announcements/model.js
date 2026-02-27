import pool from "../../config/db.js"; //importing database connection pool 

export const getAllAnnouncements = async () => { //specifically for Admins; need to see all announcements across the club, including team-specific ones, for management purposes
    try{
        const result = await pool.query('SELECT * FROM announcements'); //query to retrieve all announcements from database   
        return result.rows;
        
    } catch (err) {
        console.error("Error retrieving announcements:", err);
        throw err;
    }
}


export const getMemberAnnouncements = async (teamId) => { //regular member, requires their team and club-wide announcements
    try{
        const result = await pool.query("SELECT * FROM announcements WHERE team_id = $1 OR audience = $2", [ teamId, 'club']); //query to retrieve all member announcements from database
        return result.rows;
    } catch (err) {
        console.error("Error retrieving member announcements:", err);
        throw err;
    }
}

export const getCoachAnnouncements = async (teamId) => { //coach, requires their team and club-wide announcements
    try{
        const announcements = await pool.query("SELECT * FROM announcements WHERE team_id=$1 OR audience = $2 OR audience = $3",[teamId, 'club', 'coach']); //query to retrieve all coach announcements from database
        return announcements.rows;
    }
    catch(err){
        console.error("Error retrieving coach announcements:", err); //logs error to console for debugging
        throw err; //throws error to be handled by error handling middleware
    }
};


export const createAnnouncement = async (announcement) => {
    try{ 
        const {category,title, description,audience,admin_id,team_id } = announcement;
         const result = await pool.query(`INSERT INTO announcements (category, title, description, audience, admin_id, team_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [category, title, description , audience, admin_iD, team_id]);
    return result.rows;
    } 
    catch (err) {
        console.error("Error creating announcement:", err);
        throw err;
    }
        
} 

export const editAnnouncement = async (id, announcement) => {
    try{
        const {category,title, description,audience,admin_id,team_id } = announcement;
        const result = await pool.query(`UPDATE announcements SET category=$1, title=$2, description=$3, audience=$4, admin_id=$5, team_id=$6 WHERE announcement_id=$7 RETURNING *`,
        [category, title, description, audience, admin_id, team_id, id]);
        return result.rows[0];
    } 
    catch (err) {
        console.error("Error editing announcement:", err);
        throw err;
    }
};

export const deleteAnnouncement = async (id) => {
    const result = await pool.query("DELETE FROM announcements WHERE announcement_id=$1 RETURNING *", [id]);
    return result.rows[0];
}