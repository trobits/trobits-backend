import { Router } from "express";
import { PushController } from "./push.controller";
import { verifyUser } from "../../middlewares/auth";

const router = Router();

/**
 * ⚠️ Dev-only public endpoint (no auth):
 * POST /api/v1/push/dev/test
 * Sends a test push to a hard-coded userId.
 */
router.post("/dev/test", PushController.devTestSend);

// Authenticated endpoints
router.post("/register", verifyUser, PushController.register);
router.post("/unregister", verifyUser, PushController.unregister);
router.get("/mine", verifyUser, PushController.listMine);

export const pushRoutes = router;
