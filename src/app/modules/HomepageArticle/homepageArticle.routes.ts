import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getHomepageArticle, setHomepageArticle } from './homepageArticle.controller';

const router = Router();

const getImageExtension = (file: Express.Multer.File) => {
  const originalExt = path.extname(file.originalname);
  if (originalExt) {
    return originalExt.toLowerCase();
  }

  switch (file.mimetype) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
};

const homepageArticleStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = getImageExtension(file);
    cb(null, `homepage-article-image${ext}`);
  },
});

const homepageArticleUpload = multer({ storage: homepageArticleStorage });

router.get('/', getHomepageArticle);
router.post('/', homepageArticleUpload.single('image'), setHomepageArticle);

export default router;
