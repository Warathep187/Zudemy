import { Router } from "express";
const router = Router();
import { adminMiddleware } from "../services/auth-middleware";
import { adminGetUsers, adminSetNewInstructor, adminGetUser, adminGetPayments } from "../controllers/admin";

router.get("/users", adminMiddleware, adminGetUsers);

router.put("/add-instructor", adminMiddleware, adminSetNewInstructor);

router.get("/user/:id", adminMiddleware, adminGetUser);

router.get("/payments", adminMiddleware, adminGetPayments)

export default router;
