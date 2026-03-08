import express from 'express';
import * as userController from './controller.js';
import { authenticateJWT } from "../../middleware/authMideelware.js"; //middleware for JWT authentication

const router = express.Router();    

router.get("/users", authenticateJWT, userController.getAllUsers); 
router.get("/user/:id", authenticateJWT, userController.getUserbyId);
router.post("/user/new", authenticateJWT, userController.createUser);
router.delete("/user/delete/:id", authenticateJWT, userController.deleteUser); //

export default router;