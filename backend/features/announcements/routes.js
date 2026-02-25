import express from 'express';
import { getAllAnnouncements,getMemberAnnouncements,getCoachAnnouncements,deleteAnnouncement,createAnnouncement } from './controller.js';

const router = express.Router();    

router.get("/announcements/admin", getAllAnnouncements); 
router.get("/announcements/member/:teamId", getMemberAnnouncements);
router.get("/announcements/coach/:teamID", getCoachAnnouncements);
router.post("/announcements/newPost", createAnnouncement);
router.delete("/announcements/delete/:id", deleteAnnouncement); 


export default router