//standardized reponse function
import * as TeamModel from './model.js';
import handleResponse from '../../middleware/responseHandler.js';


export const getTeams = async (req, res,next) => {
    const user_role = req.user.user_role;
    const coach_id = req.user.user_role === "coach" ? req.user.user_id : null; //if the user is a coach, set coach_id to their user ID, otherwise set it to null for admins
    try{
        const teams = await TeamModel.getTeams(user_role, coach_id); //calls the getTeams function from the model to retrieve all teams from the database
        handleResponse(res, 200, "Teams retrieved successfully", teams); //sends a successful response with the retrieved teams
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

export const addMember = async (req, res,next) => {  
    
    const { team_id, user_id } = req.body; //expects team_id and user_id in the request body
    try{
        const member = await TeamModel.addMember(team_id, user_id); 
        if (!member) return handleResponse(res, 404, "Member not found"); //sends a 404 response if the member is not found  
        
        handleResponse(res, 200, "Member added successfully", member); //sends a successful response with the added member
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};    

export const moveMember = async (req, res,next) => {  
    
    const { team_id, user_id } = req.body; //expects team_id and user_id in the request body
    try{
        const member = await TeamModel.moveMember(team_id, user_id); //calls the moveMember function from the model to move the member to a different team
        if (!member) return handleResponse(res, 404, "Member not found"); //sends a 404 response if the member is not found  
        
        handleResponse(res, 200, "Member moved successfully", member); //sends a successful response with the moved member
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 