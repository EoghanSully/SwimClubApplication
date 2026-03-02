import express from 'express';
import * as Authcontroller from './controller.js';

const router = express.Router();    

router.post("/auth/login",Authcontroller.loginVerify); //route to verify user login credentials


export default router;