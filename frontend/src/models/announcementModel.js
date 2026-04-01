import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';
import { adaptAnnouncementRow } from '../utils/adapters.js';

//
export async function getAllAnnouncements() {
  try {
    const response = await apiGet('/announcements');  // Calls backend /api/announcements and returns response.json
    const announcements = (response.data || []).map(adaptAnnouncementRow);
    console.log("All announcements loaded:", announcements); // Logs retrieved announcements for debugging
    return announcements; // Return the announcements array from the data property
  } catch (error) {
    console.error('Fetch Request failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}

//
export async function createNewAnnouncement(announcementData) {
    try {
        const response = await apiPost('/announcements/create', announcementData); // Calls backend /api/announcements/create with announcement data and returns response.json
        const announcement = Array.isArray(response.data) ? adaptAnnouncementRow(response.data[0]) : adaptAnnouncementRow(response.data);
        console.log("Announcement created:", announcement); // Logs created announcement for debugging
        return announcement; // Return the created announcement from the data property
    } catch (error) {
        console.error('Create Announcement failure:', error.stack);
        throw error;
    }
}

export async function updateAnnouncement(announcementData) {
    try {
        const response = await apiPut('/announcements/update', announcementData); // Calls backend /api/announcements/update with announcement data and returns response.json
        return adaptAnnouncementRow(response.data); // Return the updated announcement from the data property
    } catch (error) {
        console.error('Update Announcement failure:', error.stack);
        throw error;
    }
}    

export async function deleteAnnouncement(announcementId) {
    try {       
        const response = await apiDelete(`/announcements/delete/${announcementId}`); // Calls backend /api/announcements/delete/:id with announcement ID and returns response.json
        return response; // Return delete status
    } catch (error) {
        console.error('Delete Announcement failure:', error.stack);
        throw error;
    }
}