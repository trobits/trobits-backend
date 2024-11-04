import { Router } from "express";
import { PostControllers } from "./post.controller";
import { fileUploader } from "../../../helpars/fileUploader";

const router = Router();

// create post
router.post(
  "/create-post",
  fileUploader.upload.single("image"),
  PostControllers.createPost
);

// get all posts
router.get("/all-posts", PostControllers.getAllPost);

// update post
router.patch(
  "/update-post",
  fileUploader.upload.single("image"),
  PostControllers.updatePost
);

// delete post
router.delete("/delete-post/:postId", PostControllers.deletePost);

export const postRoutes = router;
