import express from 'express';
import * as announcementController from './controller.js';

const router = express.Router();    

router.get("/announcements/admin", announcementController.getAllAnnouncements); 
router.get("/announcements/member/:teamId", announcementController.getMemberAnnouncements);
router.get("/announcements/coach/:teamID", announcementController.getCoachAnnouncements);
router.post("/announcements/new", announcementController.createAnnouncement);
router.put("/announcements/edit/:id", announcementController.editAnnouncementDetails);
router.delete("/announcements/delete/:id", announcementController.deleteAnnouncement); 


export default router;