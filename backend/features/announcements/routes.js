import express from 'express';
import * as announcementController from './controller.js';
import { authenticateJWT } from '../../middleware/auth.js'


const router = express.Router();    

router.get("/announcements", authenticateJWT, announcementController.getAllAnnouncements); 
router.get("/announcements/member/:teamId", authenticateJWT, announcementController.getMemberAnnouncements);
router.get("/announcements/coach/:teamID", authenticateJWT, announcementController.getCoachAnnouncements);
router.post("/announcements/create", authenticateJWT, announcementController.createAnnouncement);
router.put("/announcements/update", authenticateJWT, announcementController.updateAnnouncementDetails);
router.delete("/announcements/delete/:id", authenticateJWT, announcementController.deleteAnnouncement); 


export default router;