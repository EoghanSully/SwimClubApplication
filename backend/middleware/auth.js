//if(!req.header.authToken) {
// res.status(400).send({ error: "Auth token missing" }); } ---add later

//if(!req.header.authToken === "coach" || !req.header.authToken === "admin")
// res.status(401).send({ error: "Unauthorized" }); } ---add later{  

import { verifyToken } from '../features/auth/jwt.js'; 

export function authenticateJWT(req, res, next) {
  try {
    console.log('Authenticating JWT for request:', req.method, req.path);
    const cookieToken = req.cookies?.jwt;
    const authHeader = req.headers?.authorization;

    let token = cookieToken || authHeader || '';

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    req.user = decoded; // Attach decoded token payload to request object for downstream use  
    console.log('Decoded JWT payload:', decoded); // e.g. { id, role, teamIds }
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: `Invalid token: ${err.message}` });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
}
