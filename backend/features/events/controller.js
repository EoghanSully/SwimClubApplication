import handleResponse from '../../middleware/responseHandler.js';
import * as EventModel from './model.js'; //event model for database interactions

function normalizeIds(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
}

function getCoachTeams(user) {
    const coachTeamIds = normalizeIds(user.coach_team_ids);
    if (coachTeamIds.length) return coachTeamIds;
    return normalizeIds(user.team_ids || user.team_id);
}

function canCoachManageTeam(user, teamId) {
    if (!teamId) return false;
    return getCoachTeams(user).includes(Number(teamId));
}

function canManageEvent(user, event) {
    if (!event) return false;
    if (user.user_role === 'admin') return true;
    if (user.user_role !== 'coach') return false;
    return canCoachManageTeam(user, event.team_id);
}


export const getEvents = async (req, res,next) => {  
    try{
        const events = await EventModel.getEvents(req.user); //calls the getEvents function from the model to retrieve all events from the database based on user role and team ID
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
    if (req.user.user_role !== 'admin' && req.user.user_role !== 'coach'){
        return handleResponse(res, 403, "Unauthorized");
    }

    if (req.user.user_role === 'coach') {
        const targetTeamId = req.body.team_id ?? req.body.teamId ?? null;
        if (!canCoachManageTeam(req.user, targetTeamId)) {
            return handleResponse(res, 403, "Coaches can only create events for teams they coach");
        }
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
    if (req.user.user_role !== 'admin' && req.user.user_role !== 'coach'){
        return handleResponse(res, 403, "Unauthorized");
    }
    try{
        if (req.user.user_role === 'coach') {
            const existing = await EventModel.getEventById(req.body.event_id);
            if (!existing || !canManageEvent(req.user, existing)) {
                return handleResponse(res, 403, "Coaches can only update events for teams they coach");
            }

            const nextTeamId = req.body.team_id ?? req.body.teamId ?? existing.team_id;
            if (!canCoachManageTeam(req.user, nextTeamId)) {
                return handleResponse(res, 403, "Invalid team scope for coach");
            }
        }

        const event = await EventModel.UpdateEvent(req.body); //calls the UpdateEvent function from the model to update the event in the database with the data from the request body
        if(!event) return handleResponse(res, 400, "Failed to update event"); //sends a 400 response if the event update failed
        handleResponse(res, 200, "Event updated successfully", event); //sends a successful response with the updated event
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}

export const deleteEvent = async (req, res,next) => {  
    if (req.user.user_role !== 'admin' && req.user.user_role !== 'coach'){
        return handleResponse(res, 403, "Unauthorized");
    }
    const event_id = req.params.id; //retrieving event ID from the request parameters

    try{
        if (req.user.user_role === 'coach') {
            const existing = await EventModel.getEventById(event_id);
            if (!existing || !canManageEvent(req.user, existing)) {
                return handleResponse(res, 403, "Coaches can only delete events for teams they coach");
            }
        }

        const deletedEvent = await EventModel.deleteEvent(event_id); //calls the deleteEvent function from the model to delete the event from the database  
        if (!deletedEvent) return handleResponse(res, 404, "Event not found"); //sends a 404 response if the event is not found  
        
        handleResponse(res, 200, "Event deleted successfully", deletedEvent); //sends a successful response with the deleted event 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 

export const getEventAttendance = async (req, res, next) => {
    if (req.user.user_role !== 'admin' && req.user.user_role !== 'coach') {
        return handleResponse(res, 403, 'Unauthorized');
    }

    const event_id = Number(req.params.id);

    try {
        const event = await EventModel.getEventById(event_id);
        if (!event) {
            return handleResponse(res, 404, 'Event not found');
        }

        if (!canManageEvent(req.user, event)) {
            return handleResponse(res, 403, 'Unauthorized event scope');
        }

        const attendance = await EventModel.getEventAttendance(event_id);
        const normalized = attendance.map((row) => ({
            id: row.user_id,
            name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            present: !!row.attended
        }));

        return handleResponse(res, 200, 'Attendance retrieved successfully', normalized);
    } catch (err) {
        next(err);
    }
};

export const upsertEventAttendance = async (req, res, next) => {
    if (req.user.user_role !== 'admin' && req.user.user_role !== 'coach') {
        return handleResponse(res, 403, 'Unauthorized');
    }

    const event_id = Number(req.params.id);
    const { userId, present } = req.body || {};

    try {
        const event = await EventModel.getEventById(event_id);
        if (!event) {
            return handleResponse(res, 404, 'Event not found');
        }

        if (!canManageEvent(req.user, event)) {
            return handleResponse(res, 403, 'Unauthorized event scope');
        }

        const updated = await EventModel.upsertAttendance(event_id, Number(userId), !!present);
        return handleResponse(res, 200, 'Attendance updated successfully', updated);
    } catch (err) {
        next(err);
    }
};

