import { apiGet } from '../utils/api.js';

let allUsers = []; //

export async function getAllUsers() {
  try {
    const response = await apiGet('/users');  // Calls backend /api/users and returns response.json
    console.log("All users loaded:", response.data); // Logs retrieved users for debugging
    return response.data; // Return the users array from the data property
  } catch (error) {
    console.error('Fetch Reqest failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}

