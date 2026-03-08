import express from "express";
import * as PlanController from "./controller.js"; //session plans controller for handling requests
import { authenticateJWT } from "../../middleware/authMideelware.js"; //middleware for JWT authentication

const router = express.Router();

router.get("/plans", authenticateJWT,PlanController.getAllPlans);
router.post("/plans/create", authenticateJWT, PlanController.createPlan);
router.put("/plans/update", authenticateJWT, PlanController.updatePlanInfo);
router.delete("/plans/delete/:id", authenticateJWT, PlanController.deletePlan);

export default router;

//