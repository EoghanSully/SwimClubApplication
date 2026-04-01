import handleResponse from '../../middleware/responseHandler.js';
import * as EventModel from './model.js'; //event model for database interactions


export const getEvents = async (req, res,next) => {  
    const user_role = req.user.user_role; //retrieving user role from the authenticated request
    const team_id = req.user.team_id; //retrieving team ID from the authenticated request
    try{
        const events = await EventModel.getEvents(user_role, team_id); //calls the getEvents function from the model to retrieve all events from the database based on user role and team ID
        handleResponse(res, 200, "Events retrieved successfully", events); //sends a successful response with the retrieved events 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

export const getPreviousEvents = async (req, res, next) => {
    if (req.user.user_role !== 'admin'){
        return handleResponse(res, 401, "Unauthorized"); //sends a 401 response if the user is not authenticated
    }
    try{
        const events = await EventModel.getPastEvents(); //calls the getPastEvents function from the model to retrieve past events from the database
        handleResponse(res, 200, "Past events retrieved successfully", events); //sends a successful response with the retrieved past events
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};

export const createEvent = async (req,res,next) => {
    if (req.user.user_role !== 'admin'){
        return handleResponse(res, 401, "Unauthorized"); //sends a 401 response if the user is not authenticated
    }

    try{
        const event = await EventModel.createEvent(req.body); //calls the createEvent function from the model to create a new event in the database with the data from the request body
        if(!event) return handleResponse(res, 400, "Failed to create event"); //sends a 400 response if the event creation failed
        
        handleResponse(res, 201, "Event created successfully", event); //sends a successful response with the created event
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};

export const updateEventInfo = async (req,res,next) => {
    if (req.user.user_role !== 'admin'){
        return handleResponse(res, 401, "Unauthorized"); //sends a 401 response if the user is not authenticated
    }
    try{
        const event = await EventModel.UpdateEvent(req.body); //calls the UpdateEvent function from the model to update the event in the database with the data from the request body
        if(!event) return handleResponse(res, 400, "Failed to update event"); //sends a 400 response if the event update failed
        handleResponse(res, 200, "Event updated successfully", event); //sends a successful response with the updated event
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}

export const deleteEvent = async (req, res,next) => {  
    if (req.user.user_role !== 'admin'){
        return handleResponse(res, 401, "Unauthorized"); //sends a 401 response if the user is not authenticated
    }
    const event_id = req.params.id; //retrieving event ID from the request parameters

    try{
        const deletedEvent = await EventModel.deleteEvent(event_id); //calls the deleteEvent function from the model to delete the event from the database  
        if (!deletedEvent) return handleResponse(res, 404, "Event not found"); //sends a 404 response if the event is not found  
        
        handleResponse(res, 200, "Event deleted successfully", deletedEvent); //sends a successful response with the deleted event 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 

export const updateEventAttendance = async (req, res, next) => {
    const { user_role } = req.user; //retrieving user role from the authenticated request
    if (user_role !== 'admin' && user_role !== 'coach') {
        return handleResponse(res, 401, "Unauthorized"); //only admin and coach can update attendance
    }
    const { event_id, user_id, attended} = req.body; //retrieving event ID, member ID, and attendance status from the request body
    try {
        const record = await EventModel.updateAttendance(event_id, user_id, attended); //upserts attendance record
        if (!record) return handleResponse(res, 400, "Failed to update attendance");
        handleResponse(res, 200, "Attendance updated successfully", record);
    } catch (err) {
        next(err);
    }
};

