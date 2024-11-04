import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PostServices } from "./post.service";
import { CreatePostSchema, UpdatePostSchema } from "./post.validation";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const postImage = req.file?.path || "";
  const payload = CreatePostSchema.parse(req.body);
  const newPost = await PostServices.createPost(payload, postImage);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Post created successfully",
    data: newPost,
  });
});

const getAllPost = catchAsync(async (req: Request, res: Response) => {
  const posts = await PostServices.getAllPost();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  const payload = UpdatePostSchema.parse(req.body);
  const postImage = req.file?.path || "";
  const updatePost = await PostServices.updatePost(payload, postImage);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post updated successfully",
    data: updatePost,
  });
});

const deletePost = catchAsync(async (req, res) => {
  const postId = req.params.postId;
  const deletedPost = await PostServices.deletePost(postId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post deleted successfully",
    data: {},
  });
});

export const PostControllers = {
  createPost,
  getAllPost,
  updatePost,
  deletePost
};
