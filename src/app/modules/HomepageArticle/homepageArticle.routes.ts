import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  getHomepageArticle,
  setHomepageArticle,
  uploadHomepageArticleImage,
} from "./homepageArticle.controller";

const router = Router();

router.use((req, _res, next) => {
  console.log("[homepage-article HIT]", req.method, req.originalUrl);
  next();
});


const getImageExtension = (file: Express.Multer.File) => {
  const originalExt = path.extname(file.originalname);
  if (originalExt) return originalExt.toLowerCase();

  switch (file.mimetype) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
};

const homepageArticleStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    const ext = getImageExtension(file);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `homepage-article-${unique}${ext}`);
  },
});

const homepageArticleUpload = multer({ storage: homepageArticleStorage });

router.get("/", getHomepageArticle);

/**
 * Save article: expects JSON { title, body }.
 * NOTE: your main Express app must have express.json() enabled globally.
 */
router.post("/", setHomepageArticle);

/**
 * Upload image: expects multipart/form-data with field name "image".
 * Returns { url }.
 */
router.post("/images", homepageArticleUpload.single("image"), uploadHomepageArticleImage);


// TEMP DEBUG: print registered routes
console.log(
  "[homepage-article router] mounted routes:",
  router.stack
    .filter((l: any) => l.route)
    .map((l: any) => `${Object.keys(l.route.methods).join(",").toUpperCase()} ${l.route.path}`)
);


export default router;
