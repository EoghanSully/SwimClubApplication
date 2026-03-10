
import * as jwToken from './jwt.js';
import * as authModel from './model.js';
import handleResponse from '../../middleware/responseHandler.js';
//

export const loginVerify = async (req, res,next) => {  
    try{
        const user = req.body;
        const response = await authModel.getLoginCredentials(user); //calls the getLoginCredentials function from the model to verify user login
        if (!response || response.length === 0) return handleResponse(res, 401, "Invalid email or password"); //sends a 401 response if the login credentials are invalid
        
        
        //create JWT token payload with user ID, role, and team ID
        const payload = { user_id: response[0].user_id, user_role: response[0].user_role, team_id: response[0].team_id };
        const token = jwToken.generateToken(payload); //generates a JWT token for the authenticated user
        res.cookie('jwt', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
            path : "/" //sends cookie on all paths starting with / (all of them) 
            //should be secure in production to ensure it's only sent over HTTPS, but can be http in development for testing purposes. Adjust as needed based on your deployment environment.
           
        }); //sets the JWT token in a cookie

        handleResponse(res, 200, "Login successful", { user: response[0], token });
        //successful response with token for Thunder Client testing REMOVE TOKEN RETURNING IN PRODUCTION
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

