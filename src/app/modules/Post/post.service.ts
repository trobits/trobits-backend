import { Post } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import IPost from "./post.interface";

const createPost = async (payload: Partial<IPost>, postImage: string) => {
  // check user validation
  const isAuthorExis = await prisma.user.findUnique({
    where: { id: payload.authorId },
  });
  if (!isAuthorExis) {
    throw new ApiError(404, "Author not found");
  }
  // check topic validation
  const isTopicExist = await prisma.topic.findUnique({
    where: { id: payload.topicId },
  });
  if (!isTopicExist) {
    throw new ApiError(404, "Topic not found");
  }

  const newPost = await prisma.post.create({
    data: {
      content: payload.content as string,
      authorId: payload.authorId as string,
      image: postImage || "",
      topicId: payload.topicId,
    },
    include: {
      author: true,
      topic: true,
    },
  });
  if (!newPost) {
    throw new ApiError(500, "Failed to create post");
  }
  return newPost;
};

const getAllPost = async () => {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
      comments: {
        include: {
          author: true,
        },
      },
    },
  });
  if (!posts) {
    throw new ApiError(500, "Failed to fetch posts");
  }
  return posts;
};

const updatePost = async (payload: Partial<IPost>, postImage: string) => {
  const isPostExist = await prisma.post.findUnique({
    where: { id: payload.id },
  });
  // if post not exist
  if (!isPostExist) {
    throw new ApiError(404, "Post not found");
  }
  const updatePost = await prisma.post.update({
    where: { id: payload.id },
    data: {
      content: payload.content || undefined,
      image: postImage || undefined,
    },
    include: {
      topic: true,
      author: true,
    },
  });

  if (!updatePost) {
    throw new ApiError(500, "Failed to update post");
  }
  return updatePost;
};

const deletePost = async (postId: string) => {
  const isPostExist = await prisma.post.findUnique({ where: { id: postId } });
  if (!isPostExist) {
    throw new ApiError(400, "Post does not exist with this id!");
  }
  const deletedPost = await prisma.post.delete({ where: { id: postId } });
  if (!deletedPost) {
    throw new ApiError(500, "Failed to delete post!");
  }
  return true;
};

const addOrRemoveLike = async (payload: Partial<Post>) => {
  // check for user validation
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: payload.authorId,
    },
  });
  if (!isUserExist) {
    throw new ApiError(400, "User does not exist with this ID");
  }
  // check for post validation
  const post = await prisma.post.findUnique({
    where: { id: payload.id },
  });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  // define userid and is liked already or not
  const userId = payload.authorId as string;
  const isLiked = post.likers.includes(userId);

  // Update post like status
  const updatedPost = await prisma.post.update({
    where: { id: payload.id },
    data: {
      likers: isLiked
        ? { set: post.likers.filter((likerId) => likerId !== userId) }
        : { push: userId },
      likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
    },
  });

  if (!updatedPost) {
    throw new ApiError(500, "Error while updating post");
  }

  return updatedPost;
};

export const PostServices = {
  createPost,
  getAllPost,
  updatePost,
  deletePost,
  addOrRemoveLike,
};
