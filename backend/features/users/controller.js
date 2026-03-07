//standardized reponse function
import * as UserModel from './model.js';
import handleResponse from '../../middleware/responseHandler.js';


export const getAllUsers = async (req, res,next) => {  
    if (req.user.user_role !== 'admin') return handleResponse(res, 403, "Forbidden: Admins only"); //only allow admins to access this endpoint
    try{
        const users = await UserModel.getAllUsers(); //calls the getAllUsers function from the model to retrieve all users from the database
        handleResponse(res, 200, "Users retrieved successfully", users); //sends a successful response with the retrieved users 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

export const getUserbyId = async (req, res,next) => {  
    if (req.user.user_role !== 'admin' && req.user.user_role !== 'coach') {
        return handleResponse(res, 403, "Forbidden: Admins and coaches only"); //only allow admins and coaches to access this endpoint
    }
    try{
        const user_id = (req.params.id);
        //if (!Number.isInteger(userId)) return handleResponse(res, 400, "Invalid user id"); --consider adding?

        const user = await UserModel.getUserById(user_id); 
        if (!user) return handleResponse(res, 404, "User not found"); //sends a 404 response if the user is not found  
        handleResponse(res, 200, "User retrieved successfully", user); //sends a successful response with the retrieved user 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};    

export const createUser = async (req, res,next) => {  
    if (req.user.user_role !== 'admin') return handleResponse(res, 403, "Forbidden: Admins only"); //only allow admins to access this endpoint
    try{
        const newUser = await UserModel.createUser(req.body); //calls the createUser function from the model to create a new user in the database   
        handleResponse(res, 201, "User created successfully", newUser); //sends a successful response with the created user 
    }
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};



export const deleteUser = async (req, res,next) => {  
    if(req.user.user_role !== 'admin') {
        return handleResponse(res, 403, "Forbidden: Admins only"); //only allow admins to access this endpoint
    }
    try{
        const user_id = req.params.id;
        const deletedUser = await UserModel.deleteUser(user_id); //calls the deleteUser function from the model to delete the user from the database  
        if (!deletedUser) return handleResponse(res, 404, "User not found"); //sends a 404 response if the user is not found  
        
        handleResponse(res, 200, "User deleted successfully", deletedUser); //sends a successful response with the deleted user 
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
}; 