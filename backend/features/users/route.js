import express from 'express';
import { getUserbyId, getAllUsers, deleteUser } from './controller.js';

const router = express.Router();    

router.get("/user/:id", getUserbyId);
router.get("/users", getAllUsers); 
router.delete("/user/:id", deleteUser); 

export default router