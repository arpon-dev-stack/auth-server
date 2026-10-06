import { Router } from "express";
import { signUp, verifyOTP } from "../controllers/signUp.controller.js";
import { signIn } from "../controllers/signIn.controller.js";
import { forgotPassword, resetPassword } from "../controllers/forget.controller.js";
import { refresh } from "../controllers/refresh.controller.js";
import { signOut } from "../controllers/signOut.controller.js";
import { verifyMe } from "../controllers/verifyMe.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signUp);
router.post("/verify-otp", verifyOTP);
router.post("/signin", signIn);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);
router.post("/signout", signOut);
router.get("/me", authenticateToken, verifyMe);

export default router;