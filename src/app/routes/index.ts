import express from "express";
import { userRoutes } from "../modules/User/user.routes";
import { topicRoutes } from "../modules/Topic/topic.routes";
import { commentRoutes } from "../modules/Comment/comment.routes";
import { postRoutes } from "../modules/Post/post.routes";
import { articleRoutes } from "../modules/Article/article.routes";
import { shibRoutes } from "../modules/Shiba/shiba.routes";
import { luncRoutes } from "../modules/Lunc/lunc.routes";
import { contactUsRoutes } from "../modules/ContactUs/contactUs.routes";
import { shibaBurnRoutes } from "../modules/ShibaBurn/shibaBurn.route";
import { luncBurnRoutes } from "../modules/LuncBurn/luncBurn.route";
import { gameScoreRoutes } from "../modules/GameScore/gameScore.routes";
import { homepageArticleRoutes } from "../modules/HomepageArticle";
import { pushRoutes } from "../modules/Push/push.routes";
import { dailyRewardsRoutes } from "../modules/DailyRewards/dailyRewards.routes";


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
  {
    path: "/article",
    route: articleRoutes,
  },
  {
    path: "/comment",
    route: commentRoutes,
  },
  {
    path: "/shiba",
    route: shibRoutes,
  },
  {
    path: "/lunc",
    route: luncRoutes,
  },
  {
    path: "/lunc-archive",
    route: luncBurnRoutes,
  },
  {
    path: "/shiba-archive",
    route: shibaBurnRoutes,
  },
  {
    path: "/contactus",
    route: contactUsRoutes,
  },
  {
    path: "/homepage-article",
    route: homepageArticleRoutes,
  },
  {
    path: "/",
    route: gameScoreRoutes,
  },
   { path: "/push", route: pushRoutes },
   { path: "/daily-rewards", route: dailyRewardsRoutes },


];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
