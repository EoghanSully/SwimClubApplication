import {getUser} from '../models/userModel.js';

export async function loadUserProfile(user_id) {
    try {
        const userProfile = await getUser(user_id); // Load user profile using the getUser function
        console.log("User profile loaded:", userProfile); // Logs loaded user profile for debugging
        return userProfile; // Return the loaded user profile
    } catch (error) {
        console.error('Error loading user profile:', error.stack); // Logs error if loading fails
        throw error; // Rethrow the error to be handled by the caller
    }
}

export function getUserProfileForDisplay(userProfile) {
    if (!userProfile) {
        console.warn('No user profile provided for display');
        return null;
    }
    return {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role
       
    };
}   