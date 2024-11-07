import { Router } from "express";
import { UserController } from "./user.controller";
import { fileUploader } from "../../../helpars/fileUploader";
import { verifyUser } from "../../middlewares/auth";

const router = Router();

// create user
router.post("/create-user", UserController.createUser);
// login user
router.post("/login", UserController.loginUser);
// refresh accessToken with refresh token
router.get("/access-token", UserController.refreshAccessToken);
// logout user
router.get("/logout", verifyUser, UserController.logoutUser);
// get single user by email
router.post("/get-user", verifyUser, UserController.getUserByEmail);
// get single user by id
router.post("/find-user", verifyUser, UserController.getUserById);
// get all users
router.get("/all-users", UserController.getAllUsers);
// update user
router.patch(
  "/update-user/:email",
  // fileUploader.upload.single("profileImage"),
  fileUploader.upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  UserController.updateUser
);
// delete user
router.patch("/delete-user/:email", UserController.deleteUser);
// follow user
router.patch("/follow-user", verifyUser, UserController.toggleFollow);

export const userRoutes = router;
