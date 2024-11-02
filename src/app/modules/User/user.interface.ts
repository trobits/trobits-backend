import { Role, Post, Comment, Like } from "@prisma/client";

export interface IUser {
  id?: string;
  email: string;
  password: string;
  role: Role;
  isDeleted?: boolean;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  otp?: string;
  otpExpiry?: Date;
  identifier?: string;
  refreshToken?: string;
  firstName: string;
  lastName: string;
  posts?: Post[];
  comments?: Comment[];
  followers?: string[];
  likes?: Like[];
}
