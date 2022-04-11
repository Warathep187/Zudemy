import { Router } from "express";
const router = Router();
import rateLimiter from "../services/rateLimit";

import { signupValidator, loginValidator, resetPasswordValidator } from "../validators/auth";
import { signup, emailVerification, login, emailSending, resetPassword, logout } from "../controllers/auth";
import { authorizedMiddleware } from "../services/auth-middleware";

router.post("/signup", rateLimiter(5, 10, "Too many signup. Please try again later"), signupValidator, signup);

router.put("/verify", emailVerification);

router.post("/login", rateLimiter(5, 8, "Too many login. Please try again later"), loginValidator, login);

router.post("/reset/send-email", rateLimiter(3, 10, "Too many request. Please try again later"), emailSending);

router.put("/reset", resetPasswordValidator, resetPassword);

router.put("/logout", rateLimiter(1, 5, "Too many logout. Please try again later"), authorizedMiddleware, logout);

export default router;
