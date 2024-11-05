import { Router } from "express";
import { CommentControllers } from "./comment.controller";

const router = Router();
// create a new comment
router.post("/create-comment", CommentControllers.createComment);
// update the comment
router.patch("/update-comment", CommentControllers.updateComment);
// add or remove like on comment
router.patch("/add-remove-like", CommentControllers.addOrRemoveLike);
// add or remove dislike on comment
router.patch("/add-remove-dislike", CommentControllers.addOrRemoveDislike);
// delete the comment
router.delete("/delete-comment", CommentControllers.deleteComment);

export const commentRoutes = router;
