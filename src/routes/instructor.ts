import { Router } from "express";
const router = Router();
import { instructorMiddleware } from "../services/auth-middleware";
import { updateProfileValidator } from "../validators/instructor";
import { profile, updateProfile, instructorProfile, InstructorGetCourses } from "../controllers/instructor";

router.get("/profile", instructorMiddleware, profile);

router.put("/profile/update", instructorMiddleware, updateProfileValidator, updateProfile);

router.get("/instructor-profile/:instructor_id", instructorProfile);

router.get("/courses", instructorMiddleware, InstructorGetCourses);

export default router;
