import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import config from "../../../config";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Extract all <img src="..."> URLs from HTML.
 */
function extractImageSrcs(html: string): Set<string> {
  const srcs = new Set<string>();
  if (!html) return srcs;

  const imgTagRegex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgTagRegex.exec(html)) !== null) {
    const src = match?.[1]?.trim();
    if (src) srcs.add(src);
  }
  return srcs;
}

/**
 * Convert an image src URL to a local uploads filename if it points to our uploads.
 * Only returns filenames that match our homepage-article naming convention.
 */
function getHomepageArticleUploadFilenameFromSrc(src: string): string | null {
  if (!src) return null;

  try {
    const u = new URL(src, "http://localhost");
    const filename = path.basename(u.pathname);

    if (!filename.startsWith("homepage-article-")) return null;
    if (!u.pathname.includes("/uploads/")) return null;

    return filename;
  } catch {
    const filename = path.basename(src);
    if (!filename.startsWith("homepage-article-")) return null;
    if (!src.includes("/uploads/")) return null;
    return filename;
  }
}

/**
 * Basic validation: body must contain text or at least one image.
 */
function hasMeaningfulBody(html: string): boolean {
  if (!html || !html.trim()) return false;

  const hasImg = /<img\b[^>]*>/i.test(html);

  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const hasText = text.length > 0;

  return hasText || hasImg;
}

/**
 * Delete previous homepage article images that are no longer referenced.
 */
function deleteOrphanedHomepageArticleImages(oldBody: string, newBody: string) {
  const oldSrcs = extractImageSrcs(oldBody);
  const newSrcs = extractImageSrcs(newBody);

  for (const src of oldSrcs) {
    if (newSrcs.has(src)) continue;

    const filename = getHomepageArticleUploadFilenameFromSrc(src);
    if (!filename) continue;

    const filePath = path.join(UPLOADS_DIR, filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Don't fail request if cleanup fails
    }
  }
}

export const getHomepageArticle = async (req: Request, res: Response) => {
  try {
    const article = await prisma.homepageArticle.findFirst();
    if (!article) {
      return res.status(404).json({ message: "Homepage article not found" });
    }
    return res.json(article);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

/**
 * Upload a single image and return its public URL.
 */
export const uploadHomepageArticleImage = async (req: Request, res: Response) => {
  try {
    if (!req.file?.filename) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const imageUrl = `${config.backend_image_url}/${req.file.filename}`;
    return res.status(201).json({ url: imageUrl });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const setHomepageArticle = async (req: Request, res: Response) => {
  try {
    const { title, body } = req.body as { title?: string; body?: string };

    // ✅ Title is no longer required by client.
    // Schema requires String (non-null), so we normalize to empty string if missing.
    const safeTitle = (title ?? "").trim(); // keep as "" if not provided

    if (!body || !hasMeaningfulBody(body)) {
      return res.status(400).json({ message: "Body is required (text or at least one image)" });
    }

    const existing = await prisma.homepageArticle.findFirst();

    let article;
    if (existing) {
      // Update first
      article = await prisma.homepageArticle.update({
        where: { id: existing.id },
        data: {
          title: safeTitle, // ✅ always a string
          body,
        },
      });

      // Ensure only one record remains
      await prisma.homepageArticle.deleteMany({
        where: { id: { not: existing.id } },
      });

      // Cleanup orphan images
      deleteOrphanedHomepageArticleImages(existing.body || "", body);
    } else {
      article = await prisma.homepageArticle.create({
        data: {
          title: safeTitle, // ✅ always a string
          body,
        },
      });
    }

    return res.json(article);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};
