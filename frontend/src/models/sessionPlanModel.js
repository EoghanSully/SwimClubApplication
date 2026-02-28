import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';

let allPlans = []; //



export async function getAllPlans() {
  try {
    const response = await apiGet('/plans');  // Calls backend /api/plans and returns response.json
    console.log("All plans loaded in model:", response.data); // Logs retrieved plans for debugging
    return response.data; // Return the plans array from the data property
  } catch (error) {
    console.error('Fetch Request failure in model:', error.stack); // Logs error if API call fails
    throw error;
  }
}

export async function getPlanByTeamId(teamId) {
    try {
        const response = await apiGet(`/plans/team/${teamId}`); // Calls backend /api/plans/team/:teamId and returns response.json
        console.log(`Plan for team ${teamId} loaded:`, response.data); // Logs retrieved plan for debugging
        return response.data; // Return the plan for the specified team from the data property
    } catch (error) {
        console.error(`Fetch Plan for team ${teamId} failure:`, error.stack); // Logs error if API call fails
        throw error;
    }
}

export async function createNewPlan(planData) {
    try {
        const response = await apiPost('/plans/create', planData); // Calls backend /api/plans/create with plan data and returns response.json
        console.log("Plan created:", response.data); // Logs created plan for debugging
        return response.data; // Return the created plan from the data property
    } catch (error) {
        console.error('Create Plan failure:', error.stack);
        throw error;
    }
}

export async function updatePlan(planData) {
    try {
        const response = await apiPut('/plans/update', planData); // Calls backend /api/plans/update with plan data and returns response.json
        console.log("Plan updated:", response.data); // Logs updated plan for debugging
        return response.data; // Return the updated plan from the data property
    } catch (error) {
        console.error('Update Plan failure:', error.stack);
        throw error;
    }
}    

export async function deletePlan(planId) {
    try {       
        const response = await apiDelete(`/plans/delete/${planId}`); // Calls backend /api/plans/delete/:id with plan ID and returns response.json
        console.log("Plan deleted:", response); // Logs delete status for debugging
        return response; // Return delete status
    } catch (error) {
        console.error('Delete Plan failure:', error.stack);
        throw error;
    }
}