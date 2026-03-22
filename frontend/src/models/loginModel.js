import { apiGet, apiPostLogin } from '../utils/api.js';



export async function userLogin(loginData) {
  try {
    console.log('Attempting login with:', loginData.email); // Logs email being used for login attempt
    const response = await apiPostLogin('/auth/login', loginData);  
    console.log('Login response:', response); // Calls backend /api/auth/login and returns response.json
    return response.data; // Return the login response data
  } catch (error) {
    console.error('Fetch Request failure in login model:', error.stack); // Logs error if API call fails
    throw error;
  }
}