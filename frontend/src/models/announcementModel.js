import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';
import { adaptAnnouncementRow } from '../utils/adapters.js';

// FETCH ALL ANNOUNCEMENTS FROM THE API AND NORMALISE THEM.
export async function getAllAnnouncements() {
  const response = await apiGet('/announcements');
  return (response.data || []).map(adaptAnnouncementRow);
}

// CREATE A NEW ANNOUNCEMENT AND RETURN ONE NORMALISED ITEM.
export async function createNewAnnouncement(announcementData) {
  const response = await apiPost('/announcements/create', announcementData);
  return Array.isArray(response.data) ? adaptAnnouncementRow(response.data[0]) : adaptAnnouncementRow(response.data);
}

// UPDATE AN ANNOUNCEMENT AND RETURN THE UPDATED NORMALISED ITEM.
export async function updateAnnouncement(announcementData) {
  const response = await apiPut('/announcements/update', announcementData);
  return adaptAnnouncementRow(response.data);
}

// DELETE AN ANNOUNCEMENT BY ID.
export async function deleteAnnouncement(announcementId) {
  const response = await apiDelete(`/announcements/delete/${announcementId}`);
  return response;
}