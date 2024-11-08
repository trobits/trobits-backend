// import { z } from "zod";
// import { ObjectId } from "mongodb";

// const CreateArticleSchema = z.object({
//   content: z.string().nonempty("Content is required"),
//   title: z.string().nonempty("Title is required"),
// });

// const UpdatePostSchema = z
//   .object({
//     id: z.string().nonempty("Post ID is required"),
//     content: z.string().nonempty("Content is required").optional(),
//     authorId: z.string().nonempty("Author ID is required"),
//     topicId: z.string().nonempty("Topic ID is required"),
//     image: z.string().optional(),
//   })
//   .strict();

// const addOrRemoveLikeSchema = z.object({
//   id: z.string(),
//   authorId: z.string(),
// });
// export { CreateArticleSchema, UpdatePostSchema, addOrRemoveLikeSchema };
