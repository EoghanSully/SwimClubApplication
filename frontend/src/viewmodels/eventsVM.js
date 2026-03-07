import * as eventsModel from '../models/eventsModel.js';
let eventList = []; // Local array to store events for display and manipulation in the view model

export async function loadEvents() {
  try {
    eventList = await eventsModel.getAllEvents();
    console.log("Events loaded in view model:"); // Logs events for debugging
    if(eventList.length === 0) {
      console.warn("No events found. Check backend API and database.");
    }
    console.log(eventList); // Displays events in a table format in the console for easier reading
  } catch (error) {
    console.error('Error loading events:', error.stack);
  }
}


export async function createEvent(eventData) {
    try {
        const newEvent = await eventsModel.createNewEvent(eventData); // Calls model to create a new event with provided data
        eventList.push(newEvent); // Adds the newly created event to the local events array
        console.log("Event created and added to events array:", newEvent); // Logs the created event for debugging
        return newEvent; // Return the newly created event for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error creating event:', error.stack);
        throw error;
    }
}

export async function updateEvent(eventData) {  
    try {
        const updatedEvent = await eventsModel.updateEvent(eventData); // Calls model to update an existing event with provided data
        const index = eventList.findIndex(event => event.id === updatedEvent.id); // Finds the index of the updated event in the local events array
        if (index !== -1) {
            eventList[index] = updatedEvent; // Updates the event in the local array with the new data
            console.log("Event updated in events array:", updatedEvent); // Logs the updated event for debugging
        } else {
            console.warn("Updated event not found in local array:", updatedEvent); // Warns if the updated event is not found in the local array
        }       
        return updatedEvent; // Return the updated event for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error updating event:', error.stack);
        throw error;
    }       
}

//FIND MORE EFFECTIVE WAY TO UPDATE THE EVENTS ARRAY IN THE VIEW MODEL
export async function deleteEvent(eventId) {
    try {
        const deletedEvent = await eventsModel.deleteEvent(eventId); // Calls model to delete an event by its ID
        eventList = eventList.filter(event => event.id !== eventId); // Removes the deleted event from the local events array
        console.log("Event deleted and removed from events array:", deletedEvent); // Logs the deleted event for debugging
        return deletedEvent; // Return the deleted event for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error deleting event:', error.stack);
        throw error;
    }       
}
