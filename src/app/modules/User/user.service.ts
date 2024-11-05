import fs from "fs";
import { Role } from "@prisma/client";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import bcrypt from "bcrypt";
import IUser from "./user.interface";

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
  const userRole = (payload.role as Partial<Role>) || Role.ADMIN;
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
    // select: {
    //   id: true,
    //   firstName: true,
    //   lastName: true,
    //   email: true,
    //   profileImage: true,
    // },
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
    config.jwt.jwt_secret as string,
    config.jwt.refresh_token_expires_in as string
  );
  // update db with access token
  const loggedInUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    // select: {
    //   firstName: true,
    //   lastName: true,
    //   email: true,
    //   profileImage: true,
    //   isDeleted: true,
    //   role: true,
    //   refreshToken: true,
    // },
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

// logout user
const logoutUser = async (id: string) => {
  const user = prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  prisma.user.update({
    where: {
      id,
    },
    data: {
      refreshToken: null,
    },
  });
};

// get user by email
const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    // select: {
    //   id: true,
    //   firstName: true,
    //   lastName: true,
    //   email: true,
    //   profileImage: true,
    //   isDeleted: true,
    // },
    include: {
      posts: {
        include: {
          comments: true,
        },
      },
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

    // select: {
    //   id: true,
    //   firstName: true,
    //   lastName: true,
    //   email: true,
    //   profileImage: true,
    //   isDeleted: true,
    // },
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
    // select: {
    //   id: true,
    //   firstName: true,
    //   lastName: true,
    //   email: true,
    //   profileImage: true,
    // },
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
  // check if the given data already exists
  // Delete existing profile image if a new one is provided
  if (profileImageLocalPath) {
    const existingProfileImage = user.profileImage;
    if (existingProfileImage) {
      fs.unlinkSync(existingProfileImage);
    }
  }

  // Delete existing cover image if a new one is provided
  if (coverImageLocalPath) {
    const existingCoverImage = user.coverImage;
    if (existingCoverImage) {
      fs.unlinkSync(existingCoverImage);
    }
  }

  // Update the user
  const updatedUser = await prisma.user.update({
    where: { email: email },
    data: {
      firstName: payload?.firstName || undefined,
      lastName: payload.lastName || undefined,
      profileImage: profileImageLocalPath || undefined,
      coverImage: coverImageLocalPath || undefined,
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
};
