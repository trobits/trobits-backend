import { Comment } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
// create comment
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

// update comment
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
// delete comment
const deleteComment = async (payload: Partial<Comment>) => {
  // check for user validation
  const isUserExist = await prisma.comment.findFirst({
    where: {
      authorId: payload.authorId,
    },
  });
  if (!isUserExist) {
    throw new ApiError(400, "User does not exist with this ID");
  }
  // check for comment validation
  const isCommentExist = await prisma.comment.findUnique({
    where: { id: payload.id },
  });
  if (!isCommentExist) {
    throw new ApiError(404, "Comment not found");
  }
  const deletedComment = await prisma.comment.delete({
    where: { id: payload.id },
  });
  if (!deletedComment) {
    throw new ApiError(500, "Error deleting comment");
  }
  return true;
};

// add or remove like
const addOrRemoveLike = async (payload: Partial<Comment>) => {
  // check for user validation
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: payload.authorId,
    },
  });
  if (!isUserExist) {
    throw new ApiError(400, "User does not exist with this ID");
  }
  // check for comment validation
  const comment = await prisma.comment.findUnique({
    where: { id: payload.id },
  });
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  // increase comment like
  if (!comment.likers.includes(payload.authorId as string)) {
    const updatedComment = await prisma.comment.update({
      where: {
        id: payload.id,
      },
      data: {
        likers: {
          push: payload.authorId,
        },
        likeCount: {
          increment: 1,
        },
      },
    });
    if (!updatedComment) {
      throw new ApiError(500, "Error updating comment");
    }
    return updatedComment;
  }
  // decrease comment like
  if (comment.likers.includes(payload.authorId as string)) {
    const updatedComment = await prisma.comment.update({
      where: {
        id: payload.id,
      },
      data: {
        likers: comment.likers.filter(
          (likerId) => likerId !== payload.authorId
        ),
        likeCount: {
          decrement: 1,
        },
      },
    });
    if (!updatedComment) {
      throw new ApiError(500, "Error updating comment");
    }
    return updatedComment;
  }
};

// add or remove dislike
const addOrRemoveDisike = async (payload: Partial<Comment>) => {
  // check for user validation
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: payload.authorId,
    },
  });
  if (!isUserExist) {
    throw new ApiError(400, "User does not exist with this ID");
  }
  // check for comment validation
  const comment = await prisma.comment.findUnique({
    where: { id: payload.id },
  });
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  // increase comment like
  if (!comment.dislikers.includes(payload.authorId as string)) {
    const updatedComment = await prisma.comment.update({
      where: {
        id: payload.id,
      },
      data: {
        dislikers: {
          push: payload.authorId,
        },
        dislikeCount: {
          increment: 1,
        },
      },
    });
    if (!updatedComment) {
      throw new ApiError(500, "Error updating comment");
    }
    return updatedComment;
  }
  // decrease comment like
  if (comment.dislikers.includes(payload.authorId as string)) {
    const updatedComment = await prisma.comment.update({
      where: {
        id: payload.id,
      },
      data: {
        dislikers: comment.dislikers.filter(
          (dislikerId) => dislikerId !== payload.authorId
        ),
        dislikeCount: {
          decrement: 1,
        },
      },
    });
    if (!updatedComment) {
      throw new ApiError(500, "Error updating comment");
    }
    return updatedComment;
  }
};

export const CommentServices = {
  createComment,
  updateComment,
  deleteComment,
  addOrRemoveLike,
  addOrRemoveDisike,
};
