import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({ // Limit each IP to 5 login requests per 15 minutes
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many login attempts. Please try again later.' }
});

export default loginLimiter;
