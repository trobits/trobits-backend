import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string(),
  authorId: z.string(),
  postId: z.string(),
});

const updateCommentSchema = z
  .object({
    id: z.string(),
    content: z.string(),
  })
  .strict();

const deleteCommentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
});

const addOrRemoveLikeSchema = z.object({
  id: z.string(),
  authorId: z.string(),
});

export { createCommentSchema, updateCommentSchema,deleteCommentSchema,addOrRemoveLikeSchema };
