import { Router } from "express";
import { decodeUser } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { DailyRewardsController } from "./dailyRewards.controller";
import { dailyRewardsValidation } from "./dailyRewards.validation";

const router = Router();

// Decode-only auth (no token verification/expiry checks)
router.get("/status", decodeUser, DailyRewardsController.getStatus);
router.post("/claim", decodeUser, DailyRewardsController.claim);
router.delete("/clear-claims", decodeUser, DailyRewardsController.clearMyDailyClaims);


router.get(
  "/history",
  decodeUser,
  validateRequest(dailyRewardsValidation.historyQuerySchema),
  DailyRewardsController.history
);

export const dailyRewardsRoutes = router;
