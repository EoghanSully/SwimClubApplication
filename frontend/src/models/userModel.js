import { apiGet } from '../utils/api.js';
import { adaptUserRow } from '../utils/adapters.js';

let allUsers = []; //

export async function getAllUsers() {
  try {
    const response = await apiGet('/users');  // Calls backend /api/users and returns response.json
    return (response.data || []).map(adaptUserRow); // Return the users array from the data property
  } catch (error) {
    console.error('Fetch Reqest failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}

export async function getUser(user_id) {
  try {
    const response = await apiGet(`/user/${user_id}`); // Load users and store in allUsers variable
    return adaptUserRow(response.data); // Return the user data from the data property
  } catch (error) {
    console.error('Error loading users:', error.stack); // Logs error if loading fails
  }
}

export async function createUser(user) {
  try {
    const response = await apiPost(`/user/new`, user); // Load users and store in allUsers variable
    return response.data; // Return the user data from the data property
  } catch (error) {
    console.error('Error creating user:', error.stack); // Logs error if creation fails
    throw error;
  }
}

export async function deleteUser(user_id) {
  try {
    const response = await apiDelete(`/user/delete/${user_id}`); // Calls backend /api/user/:id with DELETE method
    return response.data; // Return the deleted user data from the data property
  } catch (error) {
    console.error('Error deleting user:', error.stack); // Logs error if deletion fails
    throw error;
  }
}
