import { z } from "zod";
import { ObjectId } from "mongodb";
import { PostCategory } from "@prisma/client";



const CreatePostSchema = z.object({
  content: z.string().nonempty("Content is required"),
  authorId: z.string().nonempty("Author ID is required"),
});

const UpdatePostSchema = z
  .object({
    content: z.string().nonempty("Content is required").optional(),
    topicId: z.string().nonempty("Topic ID is required").optional(),
    image: z.string().optional(),
    video: z.string().optional(),
    category: z.nativeEnum(PostCategory).optional(),
  })
  .strict();

const addOrRemoveLikeSchema = z.object({
  id: z.string(),
  authorId: z.string(),
});
export { CreatePostSchema, UpdatePostSchema, addOrRemoveLikeSchema };
