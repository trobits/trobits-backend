import { Router } from "express";
import { contactUsController } from "./contactUs.controller";

const router = Router();

console.log("Initializing Contact Us routes...");
router.post("/send-email", contactUsController.sendEmailFromContactUs);
console.log("Contact Us routes initialized");
router.post("/request-account-deletion", contactUsController.sendAccountDeletionRequest);


export const contactUsRoutes = router;
