import handleResponse from '../../middleware/responseHandler.js';
import errorHandler from '../../middleware/error.js';
import * as AnnouncementModel from './model.js'; //event model for database interactions

export const getAllAnnouncements = async (req, res,next) => {  
    try{//
        const { user_role, team_id } = req.user;
        const announcements = await AnnouncementModel.getAnnouncements(user_role,team_id); //calls the getAllAnnouncements function from the model to retrieve all announcements from the database
        handleResponse(res, 200, "Announcements retrieved successfully", announcements); //sends a successful response with the retrieved announcements 
    } 
    catch (err) {
        next(err, "Error in controller while retrieving all announcements"); //passes any errors to the error handling middleware
    }
};  



export const createAnnouncement = async (req,res,next) => {
    if(req.user.user_role !== 'admin') {
        return handleResponse(res, 401, "Unauthorized: Only admins can create announcements");
    }
    try{
        const newAnnouncement = req.body; //extracts the new announcement data from the request body
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
    if(req.user.user_role !== 'admin') {
        return handleResponse(res, 401, "Unauthorized: Only admins can update announcements");
    }
    try{
        console.log("Announcement req body:", req.body);
        const updatedAnnouncement = req.body; //extracts the updated announcement data from the request body
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
    if(req.user.user_role !== 'admin') {
        return handleResponse(res, 401, "Unauthorized: Only admins can delete announcements");
    }
    try {
        const { announcement_id } = req.params; //extracts the announcement ID from the request parameters
        const deletedAnnouncement = await AnnouncementModel.deleteAnnouncement(announcement_id); //calls the deleteAnnouncement function from the model to delete the specified announcement from the database
        if (deletedAnnouncement) {
            handleResponse(res, 200, "Announcement deleted successfully", deletedAnnouncement); //sends a successful response with the deleted announcement details
        } else {
            handleResponse(res, 404, "Announcement not found"); //sends a not found response if the announcement does not exist
        }
    } catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};