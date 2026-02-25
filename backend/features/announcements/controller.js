import handleResponse from '../../middleware/responseHandler.js';
import errorHandler from '../../middleware/error.js';
import * as AnnouncementModel from './model.js'; //event model for database interactions

export const getAllAnnouncements = async (req, res,next) => {  
    try{
        const announcements = await AnnouncementModel.getAllAnnouncements(); //calls the getAllAnnouncements function from the model to retrieve all announcements from the database
        handleResponse(res, 200, "Announcements retrieved successfully", announcements); //sends a successful response with the retrieved announcements 
    } 
    catch (err) {
        next(err, "Error in controller while retrieving all announcements"); //passes any errors to the error handling middleware
    }
};  

export const getMemberAnnouncements = async (req, res,next) => {  
    try{
        const { teamId } = req.params; //extracts the team ID from the request parameters
        const announcements = await AnnouncementModel.getMemberAnnouncements(teamId); //calls the getMemberAnnouncements function from the model to retrieve all member announcements from the database
        handleResponse(res, 200, "Member announcements retrieved successfully", announcements); //sends a successful response with the retrieved member announcements
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

export const getCoachAnnouncements = async (req,res,next) => {
    try{
        const teamID = req.params.teamID;
        const announcements = await AnnouncementModel.getCoachAnnouncements(teamID); //calls the getCoachAnnouncements function from the model to retrieve all coach announcements from the database
        handleResponse(res,200,"Coach announcements retrieved successfully", announcements); //sends a successful response with the retrieved coach announcements
    }
    catch(err){
        console.error("Error retrieving coach announcements:", err); //logs error to console for debugging
        next(err); //passes any errors to the error handling middleware
    }
}


export const createAnnouncement = async (req,res,next) => {
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

export const deleteAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params; //extracts the announcement ID from the request parameters
        const deletedAnnouncement = await AnnouncementModel.deleteAnnouncement(id); //calls the deleteAnnouncement function from the model to delete the specified announcement from the database
        if (deletedAnnouncement) {
            handleResponse(res, 200, "Announcement deleted successfully", deletedAnnouncement); //sends a successful response with the deleted announcement details
        } else {
            handleResponse(res, 404, "Announcement not found"); //sends a not found response if the announcement does not exist
        }
    } catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};