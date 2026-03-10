import { apiGet, apiPost } from '../utils/api.js';



export async function userLogin(loginData) {
  try {
    const response = await apiPost('/auth/login', loginData);  // Calls backend /api/auth/login and returns response.json
    return response.data; // Return the login response data
  } catch (error) {
    console.error('Fetch Request failure:', error.stack); // Logs error if API call fails
    throw error;
  }
}