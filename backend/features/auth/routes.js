import express from 'express';
import * as Authcontroller from './controller.js';
import loginLimiter from '../../middleware/loginLimiter.js';

const router = express.Router();    

router.post("/auth/login", loginLimiter, Authcontroller.loginVerify); //route to verify user login credentials


export default router;