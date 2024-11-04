import { Router } from "express";
import { CommentControllers } from "./comment.controller";

const router = Router();
router.post("/create-comment", CommentControllers.createComment);
router.patch("/update-comment", CommentControllers.updateComment);

export const commentRoutes = router;
