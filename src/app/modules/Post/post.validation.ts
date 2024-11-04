import { z } from "zod";
import { ObjectId } from "mongodb";

const CreatePostSchema = z.object({
  content: z.string().nonempty("Content is required"),
  authorId: z.string().nonempty("Author ID is required"),
  topicId: z.string().nonempty("Topic ID is required"),
  image: z.string().optional(),
});

const UpdatePostSchema = z
  .object({
    id: z.string().nonempty("Post ID is required"),
    content: z.string().nonempty("Content is required").optional(),
    authorId: z.string().nonempty("Author ID is required"),
    topicId: z.string().nonempty("Topic ID is required"),
    image: z.string().optional(),
  })
  .strict(); 
export { CreatePostSchema ,UpdatePostSchema};
