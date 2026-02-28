import * as announcementModel from '../models/announcementModel.js';

let announcementList = [];

export async function loadAnnouncements() {
  try {
    announcementList = await announcementModel.getAllAnnouncements();
    console.log("Announcements loaded in view model:"); // Logs announcements for debugging
    if(announcementList.length === 0) {
      console.warn("No announcements found. Check backend API and database.");
    }
    console.log(announcementList); // Displays announcements in a table format in the console for easier reading
  } catch (error) {
    console.error('Error loading announcements:', error.stack);
  }
}


export async function createAnnouncement(announcementData) {
    try {
        const newAnnouncement = await announcementModel.createNewAnnouncement(announcementData); // Calls model to create a new announcement with provided data
        announcementList.push(newAnnouncement); // Adds the newly created announcement to the local announcements array
        console.log("Announcement created and added to announcements array:", newAnnouncement); // Logs the created announcement for debugging
        return newAnnouncement; // Return the newly created announcement    
        //  for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error creating announcement:', error.stack);
        throw error;
    }
}

export async function updateAnnouncement(announcementData) {  
    try {
        const updatedAnnouncement = await announcementModel.updateAnnouncement(announcementData); // Calls model to update an existing announcement with provided data
        const index = announcementList.findIndex(announcement => announcement.id === updatedAnnouncement.id); // Finds the index of the updated announcement in the local announcements array
        if (index !== -1) {
            announcementList[index] = updatedAnnouncement; // Updates the announcement in the local array with the new data
            console.log("Announcement updated in announcements array:", updatedAnnouncement); // Logs the updated announcement for debugging
        } else {
            console.warn("Updated announcement not found in local array:", updatedAnnouncement); // Warns if the updated announcement is not found in the local array
        }       
        return updatedAnnouncement; // Return the updated announcement for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error updating announcement:', error.stack);
        throw error;
    }       
}

//FIND MORE EFFECTIVE WAY TO UPDATE THE ANNOUNCEMENTS ARRAY IN THE VIEW MODEL
export async function deleteAnnouncement(announcementId) {
    try {
        const deletedAnnouncement = await announcementModel.deleteAnnouncement(announcementId); // Calls model to delete an announcement by its ID
        announcementList = announcementList.filter(announcement => announcement.id !== announcementId); // Removes the deleted announcement from the local announcements array
        console.log("Announcement deleted and removed from announcements array:", deletedAnnouncement); // Logs the deleted announcement for debugging
        return deletedAnnouncement; // Return the deleted announcement for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error deleting announcement:', error.stack);
        throw error;
    }       
}

export function getAnnouncementsForDisplay() {
    return announcementList; // Returns the current list of announcements for display in the UI
}
    