import express from 'express';
import * as userController from './controller.js';

const router = express.Router();    

router.get("/user/:id", userController.getUserbyId);
router.get("/users", userController.getAllUsers); 
router.post("/user/create", userController.createUser);
router.delete("/user/:id", userController.deleteUser); 

export default router;