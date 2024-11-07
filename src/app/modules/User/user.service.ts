import fs from "fs";
import { Role } from "@prisma/client";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import bcrypt from "bcrypt";
import IUser from "./user.interface";
import path from "path";
import { fileUploader } from "../../../utils/uploadFileOnDigitalOcean";

// create user
const createUser = async (payload: Partial<IUser>) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email address");
  }
  const userRole = (payload.role as Partial<Role>) || Role.USER;
  const hashedPassword: string = await bcrypt.hash(
    payload.password as string,
    12
  );
  const user = await prisma.user.create({
    data: {
      firstName: payload.firstName as string,
      lastName: payload.lastName || "",
      email: payload.email as string,
      password: hashedPassword,
      role: userRole,
      profileImage: payload.profileImage ?? "",
      isDeleted: false,
      refreshToken: "",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      role: true,
    },
  });
  return user;
};

// login user
const loginUser = async (payload: Partial<IUser>) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }
  if (!payload.password) {
    throw new ApiError(400, "Password is required");
  }
  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  // get access token
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  // get refresh token
  const refreshToken = jwtHelpers.generateToken(
    {
      id: user.id,
    },
    config.jwt.refresh_token_secret as string,
    config.jwt.refresh_token_expires_in as string
  );
  // update db with access token
  const loggedInUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      isDeleted: true,
      role: true,
      coverImage: true,
      followers: true,
      following: true,
    },
    data: {
      refreshToken: refreshToken,
    },
  });

  return {
    accessToken,
    refreshToken,
    loggedInUser,
  };
};

// refresh access token
const refreshAccessToken = async (refreshToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    refreshToken,
    config.jwt.refresh_token_secret as string
  );
  if (!decodedToken) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
  const user = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });
  // check for user
  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }
  // check for refresh token validation
  if (user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Refresh Token has expired or used!");
  }
  // generate new access token
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );
  return accessToken;
};

// logout user
const logoutUser = async (id: string) => {
  const user = prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }
  prisma.user.update({
    where: {
      id,
    },
    data: {
      refreshToken: null,
    },
  });
  return true;
};

// get user by email
const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      isDeleted: true,
      posts: {
        include: {
          comments: true,
        },
      },
      coverImage: true,
      role: true,
      followers: true,
      following: true,
      comments: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};
// get user by id
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      isDeleted: true,
      posts: {
        include: {
          comments: true,
        },
      },
      coverImage: true,
      role: true,
      followers: true,
      following: true,
      comments: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};
// get all user
const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      isDeleted: true,
      posts: {
        include: {
          comments: true,
        },
      },
      coverImage: true,
      role: true,
      followers: true,
      following: true,
      comments: true,
    },
  });
  return users;
};

// update user
const updateUser = async (
  email: string,
  payload: Partial<IUser>,
  profileImageLocalPath: string | undefined,
  coverImageLocalPath: string | undefined
) => {
  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // upload profile image
  // upload image
  let profileImageUrl = "";
  // Upload image to DigitalOcean Spaces and get the cloud URL
  if (profileImageLocalPath) {
    try {
      const uploadResponse = await fileUploader.uploadToDigitalOcean({
        path: profileImageLocalPath,
        originalname: path.basename(profileImageLocalPath),
        mimetype: "image/jpeg", // Adjust this if needed (e.g., dynamically detect the type)
      } as Express.Multer.File);
      profileImageUrl = uploadResponse.Location; // Cloud URL returned from DigitalOcean
    } catch (error) {
      console.error("Failed to upload image to DigitalOcean:", error);
      throw new ApiError(500, "Failed to upload image to DigitalOcean");
    }
  }

  // upload profile image
  // upload image
  let coverImageUrl = "";
  // Upload image to DigitalOcean Spaces and get the cloud URL
  if (coverImageLocalPath) {
    try {
      const uploadResponse = await fileUploader.uploadToDigitalOcean({
        path: coverImageLocalPath,
        originalname: path.basename(coverImageLocalPath),
        mimetype: "image/jpeg", // Adjust this if needed (e.g., dynamically detect the type)
      } as Express.Multer.File);
      coverImageUrl = uploadResponse.Location; // Cloud URL returned from DigitalOcean
    } catch (error) {
      console.error("Failed to upload image to DigitalOcean:", error);
      throw new ApiError(500, "Failed to upload image to DigitalOcean");
    }
  }

  
  // Update the user
  const updatedUser = await prisma.user.update({
    where: { email: email },
    data: {
      firstName: payload?.firstName || undefined,
      lastName: payload.lastName || undefined,
      profileImage: profileImageUrl || undefined,
      coverImage: coverImageUrl || undefined,
    },
  });

  return updatedUser;
};

// delete user
const deleteUser = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  //   check if user has been deleted already
  if (user.isDeleted) {
    throw new ApiError(400, "User has already been deleted"); // return error if user has been deleted already
  }
  const deletedUser = await prisma.user.delete({
    where: {
      email: email,
    },
  });
  return deletedUser;
};

const toggleFollow = async (payload: {
  followerId: string;
  followedId: string;
}) => {
  const { followerId, followedId } = payload;

  // Check for required fields
  if (!followerId || !followedId) {
    throw new ApiError(400, "FollowerId and FollowedId are required!");
  }

  // Prevent user from following themselves
  if (followerId === followedId) {
    throw new ApiError(400, "You cannot follow yourself.");
  }

  // Check if the follower exists
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
  });
  if (!follower) {
    throw new Error("Follower does not exist");
  }

  // Check if the followed user exists
  const followed = await prisma.user.findUnique({
    where: { id: followedId },
  });
  if (!followed) {
    throw new Error("User to be followed or unfollowed does not exist");
  }

  const isFollowing = follower.following.includes(followedId);

  if (isFollowing) {
    // If currently following, unfollow the user
    await prisma.user.update({
      where: { id: followerId },
      data: {
        following: follower.following.filter((id) => id !== followedId), // Remove from following
      },
    });

    await prisma.user.update({
      where: { id: followedId },
      data: {
        followers: followed.followers.filter((id) => id !== followerId), // Remove from followers
      },
    });

    return { message: "Successfully unfollowed the user." };
  } else {
    // If not following, follow the user
    await prisma.user.update({
      where: { id: followerId },
      data: {
        following: {
          push: followedId, // Add to following
        },
      },
    });

    await prisma.user.update({
      where: { id: followedId },
      data: {
        followers: {
          push: followerId, // Add to followers
        },
      },
    });

    return { message: "Successfully followed the user." };
  }
};

export const UserService = {
  createUser,
  loginUser,
  logoutUser,
  getUserByEmail,
  updateUser,
  getUserById,
  getAllUsers,
  deleteUser,
  toggleFollow,
  refreshAccessToken,
};
