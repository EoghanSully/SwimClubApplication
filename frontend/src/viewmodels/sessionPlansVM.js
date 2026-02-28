import * as plansModel from '../models/sessionPlanModel.js';

let planList = [];

export async function loadPlans() {
  try {
    planList = await plansModel.getAllPlans();
    console.log("Plans loaded in view model:", planList); // Logs plans for debugging
    if(planList.length === 0) {
      console.warn("No plans found. Check backend API and database.");
    }
    console.log(planList); // Displays plans in a table format in the console for easier reading
  } catch (error) {
    console.error('Error loading plans:', error.stack);
  }
}


export async function createPlan(planData) {
    try {
        const newPlan = await plansModel.createNewPlan(planData); // Calls model to create a new plan with provided data
        planList.push(newPlan); // Adds the newly created plan to the local plans array
        console.log("Plan created and added to plans array:", newPlan); // Logs the created plan for debugging
        return newPlan; // Return the newly created plan    
        //  for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error creating plan:', error.stack);
        throw error;
    }
}

export async function updatePlan(planData) {  
    try {
        const updatedPlan = await plansModel.updatePlan(planData); // Calls model to update an existing plan with provided data
        const index = planList.findIndex(plan => plan.id === updatedPlan.id); // Finds the index of the updated plan in the local plans array
        if (index !== -1) {
            planList[index] = updatedPlan; // Updates the plan in the local array with the new data
            console.log("Plan updated in plans array:", updatedPlan); // Logs the updated plan for debugging
        } else {
            console.warn("Updated plan not found in local array:", updatedPlan); // Warns if the updated plan is not found in the local array
        }       
        return updatedPlan; // Return the updated plan for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error updating plan:', error.stack);
        throw error;
    }       
}

//FIND MORE EFFECTIVE WAY TO UPDATE THE PLANS ARRAY IN THE VIEW MODEL
export async function deletePlan(planId) {
    try {
        const deletedPlan = await plansModel.deletePlan(planId); // Calls model to delete a plan by its ID
        planList = planList.filter(plan => plan.id !== planId); // Removes the deleted plan from the local plans array
        console.log("Plan deleted and removed from plans array:", deletedPlan); // Logs the deleted plan for debugging
        return deletedPlan; // Return the deleted plan for further use (e.g., updating UI)
    } catch (error) {
        console.error('Error deleting plan:', error.stack);
        throw error;
    }       
}

export function getPlansForDisplay() {
    return planList; // Returns the current list of plans for display in the UI
}
    