
import { verifyToken } from '../features/auth/jwt.js'; 

export function authenticateJWT(req, res, next) {
  try {
    //console.log('Authenticating JWT for request:', req.method, req.path); // Log the incoming request method and path for debugging purposes
    const cookieToken = req.cookies?.jwt; //get token from cookie if it exists, otherwise undefined

  
    if (!cookieToken) { //if no token is found in the cookie, send a 401 response indicating authentication is required
      //console.warn('No JWT token found in cookies'); //.warn logs a warning if no token is found for debugging purposes
      return res.status(401).json({ message: 'Authentication required, no token found in cookie' });
    }

    const decoded = verifyToken(cookieToken); //verify token and decode payload

    req.user = decoded; // Attach decoded token payload to request object for downstream use  
    next();

  }
  catch (err) {
      console.error('JWT verification error:', err.message, err.stack);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: `Invalid token: ${err.message}` });
      }  
      return res.status(401).json({ message: 'Authentication failed' });
    }
}
