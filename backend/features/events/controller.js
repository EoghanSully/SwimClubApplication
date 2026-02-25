import handleResponse from '../../middleware/responseHandler.js';
import * as EventModel from './model.js'; //event model for database interactions

export const getAllEvents = async (req, res,next) => {  
    try{
        const events = await EventModel.getAllEvents(); //calls the getAllEvents function from the model to retrieve all events from the database
        handleResponse(res, 200, "Events retrieved successfully", events); //sends a successful response with the retrieved events 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

//should we do it by user ID? *****
export const getMemberEvents = async (req, res,next) => {  
    try{
        const events = await EventModel.getMemberEvents(req.params.teamId); 
        if (!events) return handleResponse(res, 404, "Events not found"); //sends a 404 response if the events are not found  
        
        handleResponse(res, 200, "Events retrieved successfully", events); //sends a successful response with the retrieved events 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

export const createEvent = async (req,res,next) => {
    try{
        const event = await EventModel.createEvent(req.body); //calls the createEvent function from the model to create a new event in the database with the data from the request body
        if(!event) return handleResponse(res, 400, "Failed to create event"); //sends a 400 response if the event creation failed
        
        handleResponse(res, 201, "Event created successfully", event); //sends a successful response with the created event
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};

export const deleteEvent = async (req, res,next) => {  
    try{
        const deletedEvent = await EventModel.deleteEvent(req.params.id); //calls the deleteEvent function from the model to delete the event from the database  
        if (!deletedEvent) return handleResponse(res, 404, "Event not found"); //sends a 404 response if the event is not found  
        
        handleResponse(res, 200, "Event deleted successfully", deletedEvent); //sends a successful response with the deleted event 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 