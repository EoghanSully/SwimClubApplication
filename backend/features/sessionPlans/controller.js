import handleResponse from '../../middleware/responseHandler.js';
import * as PlanModel from './model.js'; //session plans model

export const getAllPlans = async (req, res,next) => {  
    const {user_role, team_id} = req.user;
    try{
        const plans = await PlanModel.getPLans(user_role, team_id); //calls the getPLans function from the model to retrieve all session plans from the database
        handleResponse(res, 200, "Session plans retrieved successfully", plans); //sends a successful response with the retrieved session plans
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  


export const createPlan = async (req,res,next) => {
    if(req.user.user_role !== 'coach') {
        return handleResponse(res, 403, "Only coaches can create session plans"); //sends a 403 response if the user is not a coach
    }
    const user_id = req.user.user_id; 
    try{
        const plan = await PlanModel.createPlan(req.body, user_id); //calls the createPlan function from the model to create a new session plan in the database with the data from the request body
        if(!plan) return handleResponse(res, 400, "Failed to create session plan"); //sends a 400 response if the session plan creation failed
        
        handleResponse(res, 201, "Session plan created successfully", plan); //sends a successful response with the created session plan
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};

export const updatePlanInfo = async (req,res,next) => {
    if(req.user.user_role !== 'coach') {
        return handleResponse(res, 403, "Only coaches can update session plans"); //sends a 403 response if the user is not a coach
    }
    try{
        const plan = await PlanModel.updatePlan(req.body); //calls the updatePlan function from the model to update the session plan in the database with the data from the request body
        if(!plan) return handleResponse(res, 400, "Failed to update session plan"); //sends a 400 response if the session plan update failed
        handleResponse(res, 200, "Session plan updated successfully", plan); //sends a successful response with the updated session plan
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}

export const deletePlan = async (req, res,next) => {  
    if(req.user.user_role !== 'coach') {
        return handleResponse(res, 403, "Only coaches can delete session plans"); //sends a 403 response if the user is not a coach
    }
    try{
        const deletedPlan = await PlanModel.deletePlan(req.params.id); //calls the deletePlan function from the model to delete the session plan from the database  
        if (!deletedPlan) return handleResponse(res, 404, "Session plan not found"); //sends a 404 response if the session plan is not found  
        handleResponse(res, 200, "Session plan deleted successfully", deletedPlan); //sends a successful response with the deleted session plan
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 

