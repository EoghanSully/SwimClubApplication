import express from 'express';
import * as announcementController from './controller.js';
import { authenticateJWT } from '../../middleware/authMideelware.js'


const router = express.Router();    

router.get("/announcements", authenticateJWT, announcementController.getAllAnnouncements); 
router.post("/announcements/create", authenticateJWT, announcementController.createAnnouncement);
router.put("/announcements/update", authenticateJWT, announcementController.updateAnnouncementDetails);
router.delete("/announcements/delete/:id", authenticateJWT, announcementController.deleteAnnouncement); 


export default router;