//standardized reponse function
import * as authModel from './model.js';
import handleResponse from '../../middleware/responseHandler.js';


export const loginVerify = async (req, res,next) => {  
    try{
        const user = req.body;
        const response = await authModel.getLoginCredentials(user); //calls the getLoginCredentials function from the model to verify user login
        if (!response) return handleResponse(res, 401, "Invalid email or password"); //sends a 401 response if the login credentials are invalid
        
        handleResponse(res, 200, "Login successful", response); //sends a successful response if the login is successful
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

