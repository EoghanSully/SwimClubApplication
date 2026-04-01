import handleResponse from '../../middleware/responseHandler.js';
import errorHandler from '../../middleware/error.js';
import * as AnnouncementModel from './model.js'; //event model for database interactions

function normalizeIds(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
}

function getCoachTeams(user) {
    const coachTeams = normalizeIds(user.coach_team_ids);
    if (coachTeams.length) return coachTeams;
    return normalizeIds(user.team_ids || user.team_id);
}

function coachCanManageAnnouncement(user, announcement) {
    if (!announcement) return false;
    const coachTeams = getCoachTeams(user);
    const sameCoachTeam = announcement.team_id && coachTeams.includes(Number(announcement.team_id));
    const createdByCoach = Number(announcement.admin_id) === Number(user.user_id);
    return sameCoachTeam || createdByCoach;
}

export const getAllAnnouncements = async (req, res,next) => {  
    try{//
        const announcements = await AnnouncementModel.getAnnouncements(req.user); //calls the getAllAnnouncements function from the model to retrieve all announcements from the database
        handleResponse(res, 200, "Announcements retrieved successfully", announcements); //sends a successful response with the retrieved announcements 
    } //catches any errors that occur during the retrieval process
    catch (err) {
        next(err, "Error in controller while retrieving all announcements"); //passes any errors to the error handling middleware
    }
};  



export const createAnnouncement = async (req,res,next) => {
    if(req.user.user_role !== 'admin' && req.user.user_role !== 'coach') {
        return handleResponse(res, 403, "Unauthorized: Admins and coaches can create announcements");
    }

    if (req.user.user_role === 'coach') {
        const teamId = req.body.team_id ?? null;
        const coachTeams = getCoachTeams(req.user);
        if (teamId && !coachTeams.includes(Number(teamId))) {
            return handleResponse(res, 403, "Coaches can only target teams they coach");
        }
    }
    try{
        const newAnnouncement = { ...req.body, admin_id: req.user.user_id }; //extracts the new announcement data from the request body
        const createdAnnouncement = await AnnouncementModel.createAnnouncement(newAnnouncement); //calls the createAnnouncement function from the model to create a new announcement in the database 
        if(!createdAnnouncement) return handleResponse(res, 400, "Failed to create announcement"); //sends a 400 response if the announcement creation failed
        
        handleResponse(res,201,"Announcement created successfully", createdAnnouncement); //sends a successful response with the created announcement details
    }
    catch(err){
        console.log("Error in controller while creating announcement",err);
        next(err);
    }
};

export const updateAnnouncementDetails = async (req,res,next) => {
    if(req.user.user_role !== 'admin' && req.user.user_role !== 'coach') {
        return handleResponse(res, 403, "Unauthorized: Admins and coaches can update announcements");
    }
    try{
        if (req.user.user_role === 'coach') {
            const existing = await AnnouncementModel.getAnnouncementById(req.body.announcement_id);
            if (!coachCanManageAnnouncement(req.user, existing)) {
                return handleResponse(res, 403, "Coaches can only update their scoped announcements");
            }
        }

        const updatedAnnouncement = { ...req.body, admin_id: req.user.user_id }; //extracts the updated announcement data from the request body
        const editedAnnouncement = await AnnouncementModel.editAnnouncement(updatedAnnouncement); //calls the editAnnouncement function from the model to update the specified announcement in the database 
        if(!editedAnnouncement) return handleResponse(res, 404, "Announcement not found"); //sends a 404 response if the announcement to be edited is not found
        handleResponse(res, 200, "Announcement edited successfully", editedAnnouncement); //sends a successful response with the edited announcement details
    }
    catch(err){
        console.log("Error in controller while editing announcement", err);
        next(err);
    }
};

export const deleteAnnouncement = async (req, res, next) => {
    if(req.user.user_role !== 'admin' && req.user.user_role !== 'coach') {
        return handleResponse(res, 403, "Unauthorized: Admins and coaches can delete announcements");
    }
    try {
        const announcement_id = Number(req.params.id); //extracts the announcement ID from the request parameters

        if (req.user.user_role === 'coach') {
            const existing = await AnnouncementModel.getAnnouncementById(announcement_id);
            if (!coachCanManageAnnouncement(req.user, existing)) {
                return handleResponse(res, 403, "Coaches can only delete their scoped announcements");
            }
        }

        const deletedAnnouncement = await AnnouncementModel.deleteAnnouncement(announcement_id); //calls the deleteAnnouncement function from the model to delete the specified announcement from the database
        if (deletedAnnouncement) {
            return handleResponse(res, 200, "Announcement deleted successfully", deletedAnnouncement); //sends a successful response with the deleted announcement details
        }
       return handleResponse(res, 404, "Announcement not found"); //sends a not found response if the announcement does not exist
        
    } catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};