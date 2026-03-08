import express from 'express';
import * as teamsController from './controller.js';
import { authenticateJWT } from "../../middleware/authMideelware.js"; //middleware for JWT authentication
const router = express.Router(); //creating a new router object to define routes for the teams feature

router.get('/teams', authenticateJWT, teamsController.getTeams); 
router.post('/teams/add-member', authenticateJWT, teamsController.addMember);
router.put('/teams/move-member', authenticateJWT, teamsController.moveMember);

export default router; //exporting the router to be used in the main application file//