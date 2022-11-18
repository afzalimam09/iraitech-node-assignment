import { Router } from "express";
import { logout, signin, signup } from "./authController.js";

const router = Router();

router.post("/signup", signup);

router.post("/signin", signin);

router.get("/logout", logout);

export default router;
