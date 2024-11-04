import { Comment } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const createComment = async (payload: Partial<Comment>) => {
  // Check for user validation
  const isUserExist = await prisma.user.findUnique({
    where: { id: payload.authorId },
  });
  if (!isUserExist) {
    throw new ApiError(400, "User does not exist with this ID");
  }

  // Check for post validation
  if (!payload.postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const isPostExist = await prisma.post.findUnique({
    where: { id: payload.postId },
  });
  if (!isPostExist) {
    throw new ApiError(400, "Post does not exist");
  }

  const newComment = await prisma.comment.create({
    data: {
      content: payload.content as string,
      authorId: payload.authorId as string,
      postId: payload.postId, // postId is guaranteed to be defined here
    },
    include: {
      author: true,
    },
  });

  if (!newComment) {
    throw new ApiError(500, "Error creating comment");
  }

  return newComment;
};

const updateComment = async (payload: Partial<Comment>) => {
  // check for comment validation
  const isCommentExist = await prisma.comment.findUnique({
    where: { id: payload.id },
  });
  if (!isCommentExist) {
    throw new ApiError(404, "Comment not found");
  }
  const updatedComment = await prisma.comment.update({
    where: { id: payload.id },
    data: {
      content: payload.content,
    },
  });
  if (!updatedComment) {
    throw new ApiError(500, "Error updating comment");
  }
  return updatedComment;
};

export const CommentServices = {
  createComment,
  updateComment
};
