import { Router } from "express";
import { verifyUser } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { DailyRewardsController } from "./dailyRewards.controller";
import { dailyRewardsValidation } from "./dailyRewards.validation";

const router = Router();

// Auth required
router.get("/status", verifyUser, DailyRewardsController.getStatus);
router.post("/claim", verifyUser, DailyRewardsController.claim);
router.delete("/clear-claims", verifyUser, DailyRewardsController.clearMyDailyClaims);


router.get(
  "/history",
  verifyUser,
  validateRequest(dailyRewardsValidation.historyQuerySchema),
  DailyRewardsController.history
);

export const dailyRewardsRoutes = router;
