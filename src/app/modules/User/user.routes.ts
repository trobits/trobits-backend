import { Router } from "express";
import { UserController } from "./user.controller";
import { fileUploader } from "../../../helpars/fileUploader";
import { verifyJWT } from "../../middlewares/auth";

const router = Router();

// create user
router.post("/create-user", UserController.createUser);
// login user
router.post("/login", UserController.loginUser);
// logout user
// here need to write own auth function where no role will needed
router.get("/logout", verifyJWT, UserController.logoutUser);
// get single user by email
router.post("/get-user", UserController.getUserByEmail);
// get single user by id
router.post("/find-user", UserController.getUserById);
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

export const userRoutes = router;
