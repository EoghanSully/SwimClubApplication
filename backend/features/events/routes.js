import express from 'express';
import * as eventsController from './controller.js';
import { authenticateJWT } from "../../middleware/authMideelware.js"; //middleware for JWT authentication
const router = express.Router();    


router.get("/events", authenticateJWT, eventsController.getEvents); 
router.get("/events/past", authenticateJWT, eventsController.getPreviousEvents);
router.post("/events/create", authenticateJWT, eventsController.createEvent);
router.put("/events/update", authenticateJWT, eventsController.updateEventInfo);
router.delete("/events/delete/:id", authenticateJWT, eventsController.deleteEvent); 


//to be used later with Token to check role and team ID

export default router