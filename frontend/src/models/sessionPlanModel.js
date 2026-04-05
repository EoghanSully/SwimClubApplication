import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api.js';
import { adaptPlanRow } from '../utils/adapters.js';

// FETCH ALL SESSION PLANS AND NORMALISE THEM.
export async function getAllPlans() {
  const response = await apiGet('/plans');
  return (response.data || []).map(adaptPlanRow);
}

// CREATE A NEW SESSION PLAN AND RETURN A NORMALISED ITEM.
export async function createNewPlan(planData) {
  const response = await apiPost('/plans/create', planData);
  return adaptPlanRow(response.data);
}

// UPDATE A SESSION PLAN AND RETURN THE UPDATED NORMALISED ITEM.
export async function updatePlan(planData) {
  const response = await apiPut('/plans/update', planData);
  return adaptPlanRow(response.data);
}

// DELETE A SESSION PLAN BY ID.
export async function deletePlan(planId) {
  const response = await apiDelete(`/plans/delete/${planId}`);
  return response;
}