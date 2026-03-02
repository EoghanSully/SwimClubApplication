import express from 'express';
import * as eventsController from './controller.js';
import { authenticateJWT } from '../../middleware/auth.js'

const router = express.Router();    


router.get("/events", authenticateJWT, eventsController.getAllEvents); 
router.get("/events/:teamId", authenticateJWT, eventsController.getMemberEvents);
router.post("/event/create", authenticateJWT, eventsController.createEvent);
router.put("/event/update", authenticateJWT, eventsController.updateEventInfo);
router.delete("/event/delete/:id", authenticateJWT, eventsController.deleteEvent); 

router.get("/events", eventsController.getEvents); 
//to be used later with Token to check role and team ID

export default router