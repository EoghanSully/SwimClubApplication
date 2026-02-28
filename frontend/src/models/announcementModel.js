import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';


export async function getAllAnnouncements() {
  try {
    const response = await apiGet('/announcements');  // Calls backend /api/announcements and returns response.json
    console.log("All announcements loaded:", response.data); // Logs retrieved announcements for debugging
    return response.data; // Return the announcements array from the data property
  } catch (error) {
    console.error('Fetch Request failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}

export async function createNewAnnouncement(announcementData) {
    try {
        const response = await apiPost('/announcement/create', announcementData); // Calls backend /api/announcement/create with announcement data and returns response.json
        console.log("Announcement created:", response.data); // Logs created announcement for debugging
        return response.data; // Return the created announcement from the data property
    } catch (error) {
        console.error('Create Announcement failure:', error.stack);
        throw error;
    }
}

export async function updateAnnouncement(announcementData) {
    try {
        const response = await apiPut('/announcement/update', announcementData); // Calls backend /api/announcement/update with announcement data and returns response.json
        console.log("Announcement updated:", response.data); // Logs updated announcement for debugging
        return response.data; // Return the updated announcement from the data property
    } catch (error) {
        console.error('Update Announcement failure:', error.stack);
        throw error;
    }
}    

export async function deleteAnnouncement(announcementId) {
    try {       
        const response = await apiDelete(`/announcement/delete/${announcementId}`); // Calls backend /api/announcement/delete/:id with announcement ID and returns response.json
        console.log("Announcement deleted:", response); // Logs delete status for debugging
        return response; // Return delete status
    } catch (error) {
        console.error('Delete Announcement failure:', error.stack);
        throw error;
    }
}