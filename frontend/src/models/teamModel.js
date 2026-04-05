import { apiGet, apiPost, apiPut } from '../utils/api.js';
import { adaptTeamRows } from '../utils/adapters.js';

// FETCH ALL TEAMS AND NORMALISE THEM FOR THE UI.
export async function getAllTeams() {
  const response = await apiGet('/teams');
  return adaptTeamRows(response.data || []);
}

// ADD ONE MEMBER TO A TEAM.
export async function addMember(memberData) {
  const response = await apiPost('/teams/add-member', memberData);
  return response.data;
}

// MOVE ONE MEMBER BETWEEN TEAMS.
export async function moveMember(memberData) {
  const response = await apiPut('/teams/move-member', memberData);
  return response.data;
}