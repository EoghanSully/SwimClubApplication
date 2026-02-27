import handleResponse from '../../middleware/responseHandler.js';
import * as PlanModel from './model.js'; //session plans model

export const getAllPlans = async (req, res,next) => {  
    try{
        const plans = await PlanModel.getAllPLans(); //calls the getAllPLans function from the model to retrieve all session plans from the database
        handleResponse(res, 200, "Session plans retrieved successfully", plans); //sends a successful response with the retrieved session plans
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

export const getPlanByTeamId = async (req, res,next) => {  
    try{
        const plans = await PlanModel.getPlanByTeamId(req.headers.teamId); //calls the getPlanByTeamId function from the model to retrieve session plans for a specific team from the database
        if (!plans) return handleResponse(res, 404, "Session plans not found for this team"); //sends a 404 response if no session plans are found for the specified team
        handleResponse(res, 200, "Session plans retrieved successfully", plans); //sends a successful response with the retrieved session plans
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};

export const createPlan = async (req,res,next) => {
    try{
        const plan = await PlanModel.createPlan(req.body, req.headers.userId); //calls the createPlan function from the model to create a new session plan in the database with the data from the request body
        if(!plan) return handleResponse(res, 400, "Failed to create session plan"); //sends a 400 response if the session plan creation failed
        
        handleResponse(res, 201, "Session plan created successfully", plan); //sends a successful response with the created session plan
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};

export const updatePlanInfo = async (req,res,next) => {
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
    try{
        const deletedPlan = await PlanModel.deletePlan(req.params.id); //calls the deletePlan function from the model to delete the session plan from the database  
        if (!deletedPlan) return handleResponse(res, 404, "Session plan not found"); //sends a 404 response if the session plan is not found  
        
        handleResponse(res, 200, "Session plan deleted successfully", deletedPlan); //sends a successful response with the deleted session plan
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 

