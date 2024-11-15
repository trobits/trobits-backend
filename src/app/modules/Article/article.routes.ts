import { Router } from "express";
import { articleControllers } from "./article.controller";
import { fileUploader } from "../../../helpars/fileUploader";
import { verifyUser } from "../../middlewares/auth";

const router = Router();

// create post
router.post(
  "/create-article",
  fileUploader.upload.single("image"),
  articleControllers.createArticle
);

// get all posts
router.get("/all-article", articleControllers.getAllArticle);

// all posts by topic id

// update post
// router.patch(
//   "/update-article",
//   verifyUser,
//   fileUploader.upload.single("image"),
//   PostControllers.updatePost
// );

// delete post
// router.delete("/delete-post/:postId", articleControllers.deletePost);

// add or remove like
router.patch("/add-remove-like", articleControllers.addOrRemoveLike);

// get post by id
router.get("/:articleId", articleControllers.getSingleArticle);

export const articleRoutes = router;
