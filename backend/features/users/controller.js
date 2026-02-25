//standardized reponse function
import * as UserModel from './model.js';
import handleResponse from '../../middleware/responseHandler.js';


export const getAllUsers = async (req, res,next) => {  
    try{
        const users = await UserModel.getAllUsers(); //calls the getAllUsers function from the model to retrieve all users from the database
        handleResponse(res, 200, "Users retrieved successfully", users); //sends a successful response with the retrieved users 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

export const getUserbyId = async (req, res,next) => {  
    try{
        const user = await UserModel.getUserById(req.params.id); 
        if (!user) return handleResponse(res, 404, "User not found"); //sends a 404 response if the user is not found  
        
        handleResponse(res, 200, "User retrieved successfully", user); //sends a successful response with the retrieved user 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};    



export const deleteUser = async (req, res,next) => {  
    try{
        const deletedUser = await UserModel.deleteUser(req.params.id); //calls the deleteUser function from the model to delete the user from the database  
        if (!deletedUser) return handleResponse(res, 404, "User not found"); //sends a 404 response if the user is not found  
        
        handleResponse(res, 200, "User deleted successfully", deletedUser); //sends a successful response with the deleted user 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 