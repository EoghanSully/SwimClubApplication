import express from 'express';
import {getEventsByTeamId,createEvent,getAllEvents,deleteEvent} from './controller.js';

const router = express.Router();    

router.get("/events/:teamId", getEventsByTeamId);
router.get("/events/admin", getAllEvents); 
router.post("/event/create", createEvent);
router.delete("/event/delete/:id", deleteEvent); 

export default router