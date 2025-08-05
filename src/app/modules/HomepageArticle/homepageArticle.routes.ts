import { Router } from 'express';
import { getHomepageArticle, setHomepageArticle } from './homepageArticle.controller';

const router = Router();

router.get('/', getHomepageArticle);
router.post('/', setHomepageArticle);

export default router;
