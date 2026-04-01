import express from 'express';
import * as eventsController from './controller.js';
import { authenticateJWT } from "../../middleware/authMiddleware.js"; //middleware for JWT authentication
const router = express.Router();    


router.get("/events", authenticateJWT, eventsController.getEvents); 
router.get("/events/past", authenticateJWT, eventsController.getPreviousEvents);
router.post("/events/create", authenticateJWT, eventsController.createEvent);
router.put("/events/update", authenticateJWT, eventsController.updateEventInfo);
router.delete("/events/delete/:id", authenticateJWT, eventsController.deleteEvent); 
router.post("/events/attendance", authenticateJWT, eventsController.updateEventAttendance); //route for updating attendance records

export default router 