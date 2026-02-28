import express from 'express';
import * as announcementController from './controller.js';

const router = express.Router();    

router.get("/announcements", announcementController.getAllAnnouncements); 
router.get("/announcements/member/:teamId", announcementController.getMemberAnnouncements);
router.get("/announcements/coach/:teamID", announcementController.getCoachAnnouncements);
router.post("/announcements/create", announcementController.createAnnouncement);
router.put("/announcements/update", announcementController.updateAnnouncementDetails);
router.delete("/announcements/delete/:id", announcementController.deleteAnnouncement); 


export default router;