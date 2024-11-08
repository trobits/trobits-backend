import express from "express";
import { userRoutes } from "../modules/User/user.routes";
import { topicRoutes } from "../modules/Topic/topic.routes";
import { commentRoutes } from "../modules/Comment/comment.routes";
import { postRoutes } from "../modules/Post/post.routes";
// import { articleRoutes } from "../../../Article/article.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/topic",
    route: topicRoutes,
  },
  {
    path: "/post",
    route: postRoutes,
  },
  // {
  //   path: "/article",
  //   route: articleRoutes,
  // },
  {
    path: "/comment",
    route: commentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
