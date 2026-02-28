import express from 'express';
import * as eventsController from './controller.js';
const router = express.Router();    


router.get("/events", eventsController.getAllEvents); 
router.get("/events/:teamId", eventsController.getMemberEvents);
router.post("/event/create", eventsController.createEvent);
router.put("/event/update", eventsController.updateEventInfo);
router.delete("/event/delete/:id", eventsController.deleteEvent); 

router.get("/events", eventsController.getEvents); 
//to be used later with Token to check role and team ID

export default router