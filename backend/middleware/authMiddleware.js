import { verifyToken } from '../features/auth/jwt.js'; 

export function authenticateJWT(req, res, next) {
  try {
    const cookieToken = req.cookies?.jwt;
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken; 

    if (!token) {
      return res.status(401).json({ message: 'Authentication required, no token found in cookie' });
    }

    const decoded = verifyToken(token); //verify token and decode payload

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