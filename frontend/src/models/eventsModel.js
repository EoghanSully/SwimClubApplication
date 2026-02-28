import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';

let allEvents = []; //

export async function getAllEvents() {
  try {
    const response = await apiGet('/events');  // Calls backend /api/events and returns response.json
    console.log("All events loaded:", response.data); // Logs retrieved events for debugging
    return response.data; // Return the events array from the data property
  } catch (error) {
    console.error('Fetch Reqest failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}

export async function createNewEvent(eventData) {
    try {
        const response = await apiPost('/event/create', eventData); // Calls backend /api/event/create with event data and returns response.json
        console.log("Event created:", response.data); // Logs created event for debugging
        return response.data; // Return the created event from the data property
    } catch (error) {
        console.error('Create Event failure:', error.stack);
        throw error;
    }
}

export async function updateEvent(eventData) {
    try {
        const response = await apiPut('/event/update', eventData); // Calls backend /api/event/update with event data and returns response.json
        console.log("Event updated:", response.data); // Logs updated event for debugging
        return response.data; // Return the updated event from the data property
    } catch (error) {
        console.error('Update Event failure:', error.stack);
        throw error;
    }
}    

export async function deleteEvent(eventId) {
    try {       
        const response = await apiDelete(`/event/delete/${eventId}`); // Calls backend /api/event/delete/:id with event ID and returns response.json
        console.log("Event deleted:", response); // Logs delete status for debugging
        return response; // Return delete status
    } catch (error) {
        console.error('Delete Event failure:', error.stack);
        throw error;
    }
}


