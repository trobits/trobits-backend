import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PostServices } from "./post.service";
import {
  addOrRemoveLikeSchema,
  CreatePostSchema,
  UpdatePostSchema,
} from "./post.validation";
import { PostCategory } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";

interface Files {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
}

const createPost = catchAsync(async (req: Request, res: Response) => {
  const payload = CreatePostSchema.parse(req.body);
  // Ensure `req.files` has the correct type
  const files = req.files as Files;

  let imageUrl: string | null = null;
  let videoUrl: string | null = null;
  const userId = req.user?.id;
  const topicId = req.body.topicId || null;
  const category = req.body.category || null;

  // Check if image or video is provided and set their paths
  if (files?.image && files.image.length > 0) {
    imageUrl = files.image[0].filename;
  }

  if (files?.video && files.video.length > 0) {
    videoUrl = files.video[0].filename;
  }

  const newPost = await PostServices.createPost(
    payload,
    userId,
    topicId,
    category,
    imageUrl as string,
    videoUrl as string
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Post created successfully",
    data: newPost,
  });
});

const createVideoPost = catchAsync(async (req: Request, res: Response) => {});

const getAllPost = catchAsync(async (req: Request, res: Response) => {
  const category = req.params.category || "";
  const posts = await PostServices.getAllPost(category as PostCategory);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});

const getAllImagePost = catchAsync(async (req: Request, res: Response) => {
  const posts = await PostServices.getAllImagePost();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});
const getAllVideoPost = catchAsync(async (req: Request, res: Response) => {
  const posts = await PostServices.getAllVideoPost();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  let payload = UpdatePostSchema.parse(req.body);
  const postId = req.params.id;
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;
  const userId = req.user?.id;
  if(!userId){
    throw new ApiError(401, "Unauthorized request");
  }

  const files = req.files as Files;
  // Check if image or video is provided and set their paths
  if (files?.image && files.image.length > 0) {
    imageUrl = files.image[0].filename;
  }

  if (files?.video && files.video.length > 0) {
    videoUrl = files.video[0].filename;
  }
  const updatePost = await PostServices.updatePost(postId,userId,payload, imageUrl, videoUrl);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post updated successfully",
    data: updatePost,
  });
});

const deletePost = catchAsync(async (req, res) => {
  const postId = req.params.postId;
  const deletedPost = await PostServices.deletePost(postId,req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post deleted successfully",
    data: {},
  });
});

//add remove like
const addOrRemoveLike = catchAsync(async (req, res) => {
  const payload = addOrRemoveLikeSchema.parse(req.body);
  const userId = req.user?.id;
  const addOrRemoveLike = await PostServices.addOrRemoveLike(payload, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post updated successfully.",
    data: addOrRemoveLike,
  });
});

const getAllPostsByTopicId = catchAsync(async (req, res) => {
  const topicId = req.params.topicId;
  const posts = await PostServices.getAllPostsByTopicId(topicId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});

// get single post by postId

const getPostById = catchAsync(async (req, res) => {
  const postId = req.params.id;
  const post = await PostServices.getSinglePost(postId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post fetched successfully",
    data: post,
  });
});
// get single post by postId

const getPostByAuthorId = catchAsync(async (req, res) => {
  const authorId = req.params.authorId;
  const options = {
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 10),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };
  const result = await PostServices.getPostByAuthorId(authorId, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const increaseVideoViewCount = catchAsync(async (req, res) => {
  const result = await PostServices.increaseVideoViewCount(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Video view count increased successfully",
    data: result,
  });
});

export const PostControllers = {
  createPost,
  getAllPost,
  updatePost,
  deletePost,
  addOrRemoveLike,
  getAllPostsByTopicId,
  getPostById,
  getPostByAuthorId,
  createVideoPost,
  getAllImagePost,
  getAllVideoPost,
  increaseVideoViewCount,
};
