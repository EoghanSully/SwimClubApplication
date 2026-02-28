import express from 'express';
import * as teamsController from './controller.js';

const router = express.Router(); //creating a new router object to define routes for the teams feature

router.get('/teams', teamsController.getTeams); 
router.post('/teams/add-member', teamsController.addMember);
router.put('/teams/move-member', teamsController.moveMember);

export default router; //exporting the router to be used in the main application file