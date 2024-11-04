import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";
import { userValidation } from "./user.validation";

const createUser = catchAsync(async (req, res) => {
  // zod validation
  const payload = userValidation.createUserSchema.parse(req.body);
  const result = await UserService.createUser(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User created successfully!",
    data: result,
  });
});

const getUserByEmail = catchAsync(async (req, res) => {
  const email = req.body.email;
  const result = await UserService.getUserByEmail(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User found by email!",
    data: result,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const id = req.body.id;
  const result = await UserService.getUserById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User found by email!",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsers();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All users fetched successfully!",
    data: result,
  });
});

// const updateUser = catchAsync(async (req, res) => {
//   const { email } = req.params;
//   const payload = req.body;
//   const profileImageLocalPath = req?.file?.path;

//   const result = await UserService.updateUser(
//     email,
//     payload,
//     profileImageLocalPath
//   );
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "User updated successfully!",
//     data: result,
//   });
// });

const updateUser = catchAsync(async (req, res) => {
  const { email } = req.params;
  const payload = req.body;

  // typescript type check
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const profileImageLocalPath = files?.profileImage?.[0]?.path;
  const coverImageLocalPath = files?.coverImage?.[0]?.path;

  const result = await UserService.updateUser(
    email,
    payload,
    profileImageLocalPath,
    coverImageLocalPath
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { email } = req.params;
  const result = await UserService.deleteUser(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully!",
    data: {},
  });
});

const loginUser = catchAsync(async (req, res) => {
  const payload = req.body;
  const { refreshToken, accessToken, loggedInUser } =
    await UserService.loginUser(payload);
  const options = {
    httpOnly: true,
    secure: true,
  };
  res.cookie("accessToken", accessToken, options).status(200).json({
    success: true,
    message: "user loged in successfully",
    token: { accessToken, refreshToken },
    data: loggedInUser,
  });
});

const logoutUser = catchAsync(async (req, res) => {
  const user = req.user;
  const loggedOutUer = await UserService.logoutUser(user.id);
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res.clearCookie("accessToken", options).status(200).json({
    success: true,
    message: "User logged out successfully",
    data: {},
  });
});

export const UserController = {
  createUser,
  loginUser,
  logoutUser,
  getUserByEmail,
  getUserById,
  updateUser,
  getAllUsers,
  deleteUser,
};
