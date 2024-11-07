import { Router } from "express";
import { PostControllers } from "./post.controller";
import { fileUploader } from "../../../helpars/fileUploader";
import { verifyUser } from "../../middlewares/auth";

const router = Router();

// create post
router.post(
  "/create-post",
  fileUploader.upload.single("image"),
  PostControllers.createPost
);

// get all posts
router.get("/all-posts", PostControllers.getAllPost);

// all posts by topic id
router.get("/all-posts/:topicId", PostControllers.getAllPostsByTopicId);

// update post
router.patch(
  "/update-post",
  verifyUser,
  fileUploader.upload.single("image"),
  PostControllers.updatePost
);

// delete post
router.delete("/delete-post/:postId",verifyUser, PostControllers.deletePost);

// add or remove like
router.patch("/add-remove-like",verifyUser, PostControllers.addOrRemoveLike);

// get post by id
router.get("/:id", PostControllers.getPostById)

export const postRoutes = router;
