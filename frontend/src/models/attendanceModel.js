import { apiGet, apiPost } from '../utils/api.js';
import { adaptEventRow, adaptTeamRows } from '../utils/adapters.js';

// FETCH TEAMS USED BY THE ATTENDANCE PAGE.
export async function getAttendanceTeams() {
  const response = await apiGet('/teams/attendance');
  return adaptTeamRows(response?.data || []);
}

// FETCH EVENTS AND NORMALISE THEM FOR THE UI.
export async function getEvents() {
  const response = await apiGet('/events');
  return (response?.data || []).map(adaptEventRow);
}

// SAVE ONE ATTENDANCE CHANGE FOR ONE USER IN ONE EVENT.
export async function saveAttendance(eventId, userId, present) {
  return apiPost('/events/attendance', {
    event_id: eventId,
    user_id: userId,
    attended: present
  });
}