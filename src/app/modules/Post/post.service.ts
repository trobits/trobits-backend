import { NotificationType, Post, PostCategory } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import IPost from "./post.interface";
import { fileUploader } from "../../../utils/uploadFileOnDigitalOcean";
import path from "path";
import { Socket } from "socket.io";
import { sendNotification } from "../../../helpars/socketIo";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import config from "../../../config";
import { deleteFile } from "../../../utils/deletePreviousFile";

const createPost = async (
  payload: Partial<Post>,
  userId: string,
  topicId:string | null,
  category:PostCategory | null,
  postImage: string,
  postVideo: string
) => {
  // Check user validation
  const isAuthorExist = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!isAuthorExist) {
    throw new ApiError(404, "Author not found");
  }

  let videoUrl = "";
  // Upload video to DigitalOcean Spaces and get the cloud URL
  if (postVideo) {
    // try {
    //   const uploadResponse = await fileUploader.uploadToDigitalOcean({
    //     path: postVideo,
    //     originalname: path.basename(postVideo),
    //     mimetype: "video/mp4", // Adjust this based on the video type (e.g., detect dynamically)
    //   } as Express.Multer.File);
    //   videoUrl = uploadResponse.Location;
    // } catch (error) {
    //   console.error("Failed to upload video to DigitalOcean:", error);
    //   throw new ApiError(500, "Failed to upload video to DigitalOcean");
    // }

    videoUrl = `${config.backend_image_url}/${postVideo}`;
  }

  let imageUrl = "";
  // Upload image to DigitalOcean Spaces and get the cloud URL
  if (postImage) {
    // try {
    //   const uploadResponse = await fileUploader.uploadToDigitalOcean({
    //     path: postImage,
    //     originalname: path.basename(postImage),
    //     mimetype: "image/jpeg", // Adjust this if needed (e.g., dynamically detect the type)
    //   } as Express.Multer.File);
    //   imageUrl = uploadResponse.Location; // Cloud URL returned from DigitalOcean
    // } catch (error) {
    //   console.error("Failed to upload image to DigitalOcean:", error);
    //   throw new ApiError(500, "Failed to upload image to DigitalOcean");
    // }

    imageUrl = `${config.backend_image_url}/${postImage}`;
  }

  // Create post with or without topic
  const newPost = await prisma.post.create({
    data: {
      content: payload.content as string,
      authorId: userId as string,
      image: imageUrl || "",
      video: videoUrl || "",
      topicId: topicId || null,
      category: category || null,
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

// const getAllPost = async (category: PostCategory | "") => {
//   // dynamic condition for category
//   const whereCondition = category ? { category } : {};

//   // Fetch posts with the necessary fields and counts

//   const posts = await prisma.post.findMany({
//     where: whereCondition,
//     include: {
//       author: true,
//       topic: true,
//       comments: {
//         include: {
//           author: true,
//         },
//       },
//     },
//   });

//   if (!posts) {
//     throw new ApiError(500, "Failed to fetch posts");
//   }

//   // Calculate score for each post and sort by score in descending order
//   const sortedPosts = posts
//     .map((post) => ({
//       ...post,
//       commentCount: post.comments.length, // Count comments for each post
//       score: post.comments.length * 2 + post.likeCount, // Calculate the score
//     }))
//     .sort((a, b) => b.score - a.score); // Sort by score in descending order

//   return sortedPosts;
// };

const getAllPost = async (category: PostCategory | "") => {
  const whereCondition = category ? { category } : {};

  const posts = await prisma.post.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
      topic: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!posts) {
    throw new ApiError(500, "Failed to fetch posts");
  }

  // const sortedPosts = posts
  //   .map((post) => {
  //     const commentCount = post.comments.length;
  //     const likeCount = post.likeCount;
  //     const postAgeInHours =
  //       (new Date().getTime() - new Date(post.createdAt).getTime()) / 3600000;

  //     // Adjust score with time-decay factor
  //     const score =
  //       (commentCount * 2 + likeCount) / Math.pow(1 + postAgeInHours, 0.5); // Time-decay factor

  //     return { ...post, commentCount, score };
  //   })
  //   .sort((a, b) => b.score - a.score);

  return posts;
};

const getAllImagePost = async () => {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { category: "IMAGE" },
        {
          AND: [
            { image: { not: "" } }, 
            { video: "" }, 
          ],
        },
      ],
      topic: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
      topic: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!posts) {
    throw new ApiError(500, "Failed to fetch posts");
  }
  // // Calculate score for each post and sort by score in descending order
  // const sortedPosts = posts
  //   .map((post) => ({
  //     ...post,
  //     commentCount: post.comments.length, // Count comments for each post
  //     score: post.comments.length * 2 + post.likeCount, // Calculate the score
  //   }))
  //   .sort((a, b) => b.score - a.score); // Sort by score in descending order

  return posts;
};

const getAllVideoPost = async () => {
  const posts = await prisma.post.findMany({
    where: {
      category: "VIDEO",
      topic: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
      topic: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!posts) {
    throw new ApiError(500, "Failed to fetch posts");
  }
  // Calculate score for each post and sort by score in descending order
  // const sortedPosts = posts
  //   .map((post) => ({
  //     ...post,
  //     commentCount: post.comments.length, // Count comments for each post
  //     score: post.comments.length * 2 + post.likeCount, // Calculate the score
  //   }))
  //   .sort((a, b) => b.score - a.score); // Sort by score in descending order

  return posts;
};

const updatePost = async (
  postId: string,
  userId: string,
  payload: any,
  postImage: string | null,
  postVideo: string | null
) => {
  const isPostExist = await prisma.post.findUnique({
    where: { id: postId },
  });
  console.log(postId);
  // If post not exist
  if (!isPostExist) {
    throw new ApiError(404, "Post not found");
  }
  console.log(payload);

  // Upload image if provided
  let imageUrl = "";
  let videoUrl = "";
  if (postImage) {
    try {
      // const uploadResponse = await fileUploader.uploadToDigitalOcean({
      //   path: postImage,
      //   originalname: path.basename(postImage),
      //   mimetype: "image/jpeg", // Adjust if needed
      // } as Express.Multer.File);
      imageUrl = `${config.backend_image_url}/${postImage}`;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw new ApiError(500, "Failed to upload image");
    }
  }

  //upload video if provided
  if (postVideo) {
    try {
      // const uploadResponse = await fileUploader.uploadToDigitalOcean({
      //   path: postImage,
      //   originalname: path.basename(postImage),
      //   mimetype: "image/jpeg", // Adjust if needed
      // } as Express.Multer.File);
      videoUrl = `${config.backend_image_url}/${postVideo}`;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw new ApiError(500, "Failed to upload image");
    }
  }

  // Update the post with or without topic
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      content: payload.content || undefined,
      image: imageUrl || undefined,
      topicId: payload.topicId || null,
      video: videoUrl || undefined,
    },
    include: {
      topic: true,
      author: true,
    },
  });
  if (isPostExist.video && videoUrl) {
    deleteFile(isPostExist.video);
  }

  if (!updatedPost) {
    throw new ApiError(500, "Failed to update post");
  }

  return updatedPost;
};

// Delete Post (with or without topic)
const deletePost = async (postId: string, userId: string) => {
  const isPostExist = await prisma.post.findUnique({ where: { id: postId } });
  if (!isPostExist) {
    throw new ApiError(400, "Post does not exist with this id!");
  }
  const isUserExist = await prisma.user.findUnique({ where: { id: userId } });
  if (!isUserExist || isPostExist.authorId !== userId) {
    throw new ApiError(400, "You are not allowed to delete this post!");
  }
  // Check if any comments exist for this post
  const hasComment = await prisma.comment.findFirst({
    where: {
      postId: postId,
    },
  });

  // Delete the comment if exists
  if (hasComment) {
    prisma.comment.delete({
      where: {
        id: hasComment.id,
      },
    });
  }

  // Delete the post
  const deletedPost = await prisma.post.delete({ where: { id: postId } });
  if (!deletedPost) {
    throw new ApiError(500, "Failed to delete post!");
  }
  return true;
};

const addOrRemoveLike = async (payload: Partial<Post>, userId: string) => {
  // check for user validation
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!isUserExist) {
    throw new ApiError(400, "User does not exist with this ID");
  }

  // check for post validation
  const post = await prisma.post.findFirst({
    where: { id: payload.id },
  });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  // define userid and is liked already or not
  // const userId = userid as string;
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

  // Notify post author if liked
  if (sendNotification) {
    await sendNotification(
      updatedPost.authorId,
      isUserExist.id,
      `${isUserExist.firstName + " " + isUserExist.lastName} has ${
        isLiked ? "Dislike" : "Like"
      } your post`,
      NotificationType.LIKE,
      updatedPost?.id as string,
      updatedPost?.category
    );
  } else {
    console.log("sendNotification is not available.");
  }

  return updatedPost;
};

const getAllPostsByTopicId = async (topicId: string) => {
  const posts = await prisma.post.findMany({
    where: { topicId },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!posts) {
    throw new ApiError(500, "Failed to fetch posts");
  }
  return posts;
};

const getSinglePost = async (postId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  return post;
};

const getPostByAuthorId = async (
  authorId: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);
  // check for user validation
  const isUserExist = await prisma.user.findUnique({
    where: { id: authorId },
  });
  if (!isUserExist) {
    throw new ApiError(400, "User does not exist with this ID");
  }
  const post = await prisma.post.findMany({
    // where: { authorId: authorId },
    // where: { author: { followers: { has: authorId } } },
    where: {
      OR: [{ authorId }, { author: { followers: { has: authorId } } }],
    },
    include: {
      author: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
  });

  const total = await prisma.post.count({
    where: {
      OR: [
        { authorId: authorId },
        { author: { followers: { has: authorId } } },
      ],
    },
  });

  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: post,
  };
};

const increaseVideoViewCount = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
  });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  if (post.category !== PostCategory.VIDEO) {
    throw new ApiError(400, "Post is not a video");
  }
  const result = await prisma.post.update({
    where: { id },
    data: {
      viewCount: (post.viewCount || 0) + 1,
    },
    select: {
      id: true,
      viewCount: true,
    },
  });
  return result;
};
export const PostServices = {
  createPost,
  getAllPost,
  updatePost,
  deletePost,
  addOrRemoveLike,
  getAllPostsByTopicId,
  getSinglePost,
  getPostByAuthorId,
  getAllImagePost,
  getAllVideoPost,
  increaseVideoViewCount,
};
