import express from "express";
import * as PlanController from "./controller.js"; //session plans controller for handling requests

const router = express.Router();

router.get("/plans", PlanController.getAllPlans);
router.get("/plans/team/:teamId", PlanController.getPlanByTeamId);
router.post("/plans/create", PlanController.createPlan);
router.put("/plans/update", PlanController.updatePlanInfo);
router.delete("/plans/delete/:id", PlanController.deletePlan);

export default router;