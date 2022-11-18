import { Router } from "express";

const router = Router();

import authRoute from "./auth/authRoute.js";
import userRoute from "./user/userRoute.js";

router.use("/auth", authRoute);
router.use("/user", userRoute);

export default router;
