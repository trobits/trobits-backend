import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../../../config';
import { deleteFile } from '../../../utils/deletePreviousFile';

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

    const imageFilename = req.file?.filename;
    const imageUrl = imageFilename
      ? `${config.backend_image_url}/${imageFilename}`
      : undefined;

    const existing = await prisma.homepageArticle.findFirst();

    let article;
    if (existing) {
      if (imageUrl && existing.image && existing.image !== imageUrl) {
        deleteFile(existing.image);
      }

      const updateData: { title: string; body: string; image?: string } = {
        title,
        body,
      };
      if (imageUrl) {
        updateData.image = imageUrl;
      }

      article = await prisma.homepageArticle.update({
        where: { id: existing.id },
        data: updateData,
      });

      await prisma.homepageArticle.deleteMany({
        where: { id: { not: existing.id } },
      });
    } else {
      article = await prisma.homepageArticle.create({
        data: {
          title,
          body,
          image: imageUrl || undefined,
        },
      });
    }

    return res.json(article);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
