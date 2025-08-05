import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getHomepageArticle = async (req: Request, res: Response) => {
  try {
    const article = await prisma.homepageArticle.findFirst();
    if (!article) {
      return res.status(404).json({ message: 'Homepage article not found' });
    }
    return res.json(article);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const setHomepageArticle = async (req: Request, res: Response) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }
    // Delete all previous articles (should only be one)
    await prisma.homepageArticle.deleteMany();
    // Create new article
    const article = await prisma.homepageArticle.create({
      data: { title, body },
    });
    return res.json(article);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
