import { apiPost } from '../utils/api.js';

// SEND LOGIN DETAILS AND RETURN USER AUTH DATA.
export async function userLogin(loginData) {
  const response = await apiPost('/auth/login', loginData);
  return response.data;
}