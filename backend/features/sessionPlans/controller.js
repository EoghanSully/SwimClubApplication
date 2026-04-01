import handleResponse from '../../middleware/responseHandler.js';
import * as PlanModel from './model.js'; //session plans model

function normalizeIds(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
}

function getCoachTeams(user) {
    const coachTeams = normalizeIds(user.coach_team_ids);
    if (coachTeams.length) return coachTeams;
    return normalizeIds(user.team_ids || user.team_id);
}

export const getAllPlans = async (req, res,next) => {  
    const {user_role} = req.user;
    if (user_role !== 'admin' && user_role !== 'coach') {
        return handleResponse(res, 403, "Only admins and coaches can access session plans");
    }
    try{
        const plans = await PlanModel.getPLans(req.user); //calls the getPLans function from the model to retrieve all session plans from the database
        handleResponse(res, 200, "Session plans retrieved successfully", plans); //sends a successful response with the retrieved session plans
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  


export const createPlan = async (req,res,next) => {
    if(req.user.user_role !== 'coach' && req.user.user_role !== 'admin') {
        return handleResponse(res, 403, "Only admins and coaches can create session plans");
    }

    if (req.user.user_role === 'coach') {
        const coachTeams = getCoachTeams(req.user);
        if (!coachTeams.includes(Number(req.body.team_id))) {
            return handleResponse(res, 403, "Coaches can only create plans for teams they coach");
        }
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
    if(req.user.user_role !== 'coach' && req.user.user_role !== 'admin') {
        return handleResponse(res, 403, "Only admins and coaches can update session plans");
    }

    if (req.user.user_role === 'coach') {
        const existing = await PlanModel.getPlanById(req.body.plan_id);
        const coachTeams = getCoachTeams(req.user);
        if (!existing || !coachTeams.includes(Number(existing.team_id))) {
            return handleResponse(res, 403, "Coaches can only update plans for teams they coach");
        }

        if (!coachTeams.includes(Number(req.body.team_id ?? existing.team_id))) {
            return handleResponse(res, 403, "Invalid team scope for coach");
        }
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
    if(req.user.user_role !== 'coach' && req.user.user_role !== 'admin') {
        return handleResponse(res, 403, "Only admins and coaches can delete session plans");
    }

    if (req.user.user_role === 'coach') {
        const existing = await PlanModel.getPlanById(req.params.id);
        const coachTeams = getCoachTeams(req.user);
        if (!existing || !coachTeams.includes(Number(existing.team_id))) {
            return handleResponse(res, 403, "Coaches can only delete plans for teams they coach");
        }
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

