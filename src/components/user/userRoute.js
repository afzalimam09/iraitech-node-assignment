import { Router } from "express";
import { protect } from "../auth/authController.js";
import {
    editProfile,
    getProfile,
    getUserList,
    uploadUserPhoto,
} from "./userController.js";

const router = Router();

// Public User List
router.get("/user-list", getUserList);

// Protect profile and edit profile route only for loggedin user
router.use(protect);

router.get("/profile", getProfile);
router.patch("/edit-profile", uploadUserPhoto, editProfile);

export default router;
