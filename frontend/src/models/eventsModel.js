import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';

let allEvents = []; 

export async function getAllEvents() {
  try {
    const response = await apiGet('/events');  // Calls backend /api/events and returns response.json
    return response.data; // Return the events array from the data property
  } catch (error) {
    console.error('Fetch Reqest failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}

export async function getPastEvents() {
  try {
    const response = await apiGet('/events/past');  // Calls backend /api/events/past and returns response.json
    return response.data; // Return the past events array from the data property
  } catch (error) {
    console.error('Fetch Request failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}

export async function createNewEvent(eventData) {
    try {
        const response = await apiPost('/events/create', eventData); // Calls backend /api/events/create with event data and returns response.json
        return response.data; // Return the created event from the data property
    } catch (error) {
        console.error('Create Event failure:', error.stack);
        throw error;
    }
}

export async function updateEvent(eventData) {
    try {
        const response = await apiPut('/events/update', eventData); // Calls backend /api/events/update with event data and returns response.json
        return response.data; // Return the updated event from the data property
    } catch (error) {
        console.error('Update Event failure:', error.stack);
        throw error;
    }
}    

export async function deleteEvent(eventId) {
    try {       
        const response = await apiDelete(`/events/delete/${eventId}`); // Calls backend /api/events/delete/:id with event ID and returns response.json
        return response; // Return delete status
    } catch (error) {
        console.error('Delete Event failure:', error.stack);
        throw error;
    }
}

export async function getEventAttendance(eventId) {
    try {
        const response = await apiGet(`/events/${eventId}/attendance`); // Calls backend /api/events/:event_id/attendance
        return response.data;
    } catch (error) {
        console.error('Fetch attendance failure:', error.stack);
        throw error;
    }
}

export async function updateEventAttendance(attendanceData) {
    try {
        const response = await apiPut('/events/attendance', attendanceData); // Calls backend /api/events/attendance
        return response.data;
    } catch (error) {
        console.error('Update attendance failure:', error.stack);
        throw error;
    }
}


