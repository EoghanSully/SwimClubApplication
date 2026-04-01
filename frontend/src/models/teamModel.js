import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';
import { adaptTeamRows } from '../utils/adapters.js';

let teams = []; //



export async function getAllTeams() {
  try {
    const response = await apiGet('/teams');  // Calls backend /api/teams and returns response.json
    return adaptTeamRows(response.data || []); // Return the teams array from the data property
  } catch (error) {
    console.error('Fetch Request failure in model:', error.stack); // Logs error if API call fails
    throw error;
  }
}


export async function addMember(memberData) {
    try {
    const response = await apiPost('/teams/add-member', memberData); // Calls backend /api/teams/add-member with member data and returns response.json
        return response.data; // Return the added member from the data property
    } catch (error) {
        console.error('Add Member failure:', error.stack);
        throw error;
    }
}    

export async function moveMember(memberData) {
    try {       
        const response = await apiPut('/teams/move-member', memberData); // Calls backend /api/teams/move-member with member data and returns response.json
        return response.data; // Return the moved member from the data property
    } catch (error) {
        console.error('Move Member failure:', error.stack);
        throw error;
    }
}