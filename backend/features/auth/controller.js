
import * as jwToken from './jwt.js';
import * as authModel from './model.js';
import handleResponse from '../../middleware/responseHandler.js';
//

export const loginVerify = async (req, res,next) => {  
    try{
        const loginData = req.body;
        const response = await authModel.getLoginCredentials(loginData); //calls the getLoginCredentials function from the model to verify user login
        if (!response || response.length === 0) return handleResponse(res, 401, "Invalid email or password"); //sends a 401 response if the login credentials are invalid
        
        
        // create JWT token payload with user ID, role, and team ID
        const user = response[0];
        const payload = {
            user_id: user.user_id,
            user_role: user.user_role,
            team_id: user.team_ids?.[0] ?? null,
            team_ids: user.team_ids || [],
            coach_team_ids: user.coach_team_ids || []
        };
        const token = jwToken.generateToken(payload); // generates a JWT token for the authenticated user
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 60 * 60 * 1000, // 1 hour
            path: "/" // send cookie on all paths
        }); // sets the JWT token in a cookie

        // Data sent for frontend usage (user info + token)
        handleResponse(res, 200, "Login successful", {
            user: {
                id: user.user_id,
                name: `${user.first_name} ${user.last_name}`,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.user_role,
                teamId: user.team_ids?.[0] ?? null,
                teamIds: user.team_ids || [],
                coachTeamIds: user.coach_team_ids || []
            },
            token
        });
        //successful response with token for Thunder Client testing REMOVE TOKEN RETURNING IN PRODUCTION
    } 
    catch (err) {
        next(err); //passes any errors to the error handling middleware
    }
};  

