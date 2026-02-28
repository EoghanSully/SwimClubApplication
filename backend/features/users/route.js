import express from 'express';
import * as userController from './controller.js';

const router = express.Router();    

router.get("/users", userController.getAllUsers); 
router.post("/user/new", userController.createUser);
router.post("/user/create", userController.createUser);
//router.get("/user/:id(\\d+)", userController.getUserbyId);
router.delete("/user/delete/:id", userController.deleteUser); 

export default router;