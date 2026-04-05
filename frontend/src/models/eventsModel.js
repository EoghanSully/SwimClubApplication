import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';
import { adaptEventRow } from '../utils/adapters.js';

// FETCH ALL EVENTS AND NORMALISE THEM.
export async function getAllEvents() {
  const response = await apiGet('/events');
  return (response.data || []).map(adaptEventRow);
}

// FETCH PAST EVENTS AND NORMALISE THEM.
export async function getPastEvents() {
  const response = await apiGet('/events/past');
  return (response.data || []).map(adaptEventRow);
}

// CREATE A NEW EVENT AND RETURN NORMALISED DATA.
export async function createNewEvent(eventData) {
  const response = await apiPost('/events/create', eventData);
  return Array.isArray(response.data) ? response.data.map(adaptEventRow) : adaptEventRow(response.data);
}

// UPDATE AN EVENT AND RETURN THE UPDATED NORMALISED ITEM.
export async function updateEvent(eventData) {
  const response = await apiPut('/events/update', eventData);
  return adaptEventRow(response.data);
}

// DELETE AN EVENT BY ID.
export async function deleteEvent(eventId) {
  const response = await apiDelete(`/events/delete/${eventId}`);
  return response;
}


