import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';

let allPlans = []; //



export async function getAllPlans() {
  try {
    const response = await apiGet('/plans');  // Calls backend /api/plans and returns response.json
    return response.data; // Return the plans array from the data property
  } catch (error) {
    console.error('Fetch Request failure in model:', error.stack); // Logs error if API call fails
    throw error;
  }
}


export async function createNewPlan(planData) {
    try {
        const response = await apiPost('/plans/create', planData); // Calls backend /api/plans/create with plan data and returns response.json
        return response.data; // Return the created plan from the data property
    } catch (error) {
        console.error('Create Plan failure:', error.stack);
        throw error;
    }
}

export async function updatePlan(planData) {
    try {
        const response = await apiPut('/plans/update', planData); // Calls backend /api/plans/update with plan data and returns response.json
        return response.data; // Return the updated plan from the data property
    } catch (error) {
        console.error('Update Plan failure:', error.stack);
        throw error;
    }
}    

export async function deletePlan(planId) {
    try {       
        const response = await apiDelete(`/plans/delete/${planId}`); // Calls backend /api/plans/delete/:id with plan ID and returns response.json
        return response; // Return delete status
    } catch (error) {
        console.error('Delete Plan failure:', error.stack);
        throw error;
    }
}