import { Router } from "express";
const router = Router();
import {
    authorizedMiddleware,
    instructorMiddleware,
    publicMiddleware,
    canAccessCourse,
} from "../services/auth-middleware";
import { createCourseValidator, updateCourseValidator } from "../validators/course";
import {
    createCourse,
    courseData,
    updateCourse,
    uploadCourseImage,
    addSection,
    removeSection,
    publish,
    cancelPublish,
    addLecture,
    uploadLectureVideo,
    removeLecture,
    paymentPreparing,
    getQuestions,
    askNewQuestion,
    removeQuestion,
    getAnswers,
    answerQuestion,
    removeAnswer,
    getReviews,
    getCourse,
    getCourseSections,
    reviewCourse
} from "../controllers/course";
import upload from "../services/multerConfig";
import rateLimiter from "../services/rateLimit";

router.post("/create", instructorMiddleware, createCourseValidator, createCourse);

router.get("/update/:id", instructorMiddleware, courseData);

router.put("/update", instructorMiddleware, updateCourseValidator, updateCourse);

router.put("/update/upload-image", instructorMiddleware, uploadCourseImage);

router.put("/sections/add", instructorMiddleware, addSection);

router.put("/sections/remove", instructorMiddleware, removeSection);

router.put("/sections/publish", instructorMiddleware, publish);

router.put("/sections/cancel-publish", instructorMiddleware, cancelPublish);

router.put("/lectures/add", instructorMiddleware, addLecture);

router.post("/lectures/upload-video", upload.single("video"), instructorMiddleware, uploadLectureVideo);

router.put("/lectures/remove", instructorMiddleware, removeLecture);

router.get("/payments/:id", authorizedMiddleware, paymentPreparing);

router.get("/questions/:id", authorizedMiddleware, canAccessCourse, getQuestions);

router.post(
    "/questions/add",
    rateLimiter(1, 3, "Too many asking question"),
    authorizedMiddleware,
    canAccessCourse,
    askNewQuestion
);

router.delete("/questions/remove/:id", authorizedMiddleware, canAccessCourse, removeQuestion);

router.get("/questions/:id/answers", authorizedMiddleware, canAccessCourse, getAnswers)

router.post("/questions/answers/add", rateLimiter(1, 4, "Too many reply this question"), authorizedMiddleware, canAccessCourse, answerQuestion);

router.delete("/questions/answers/remove/:id", authorizedMiddleware, canAccessCourse, removeAnswer); // Incomplete

router.get("/:id", publicMiddleware, getCourse);

router.get("/:id/sections", getCourseSections);

router.get("/:id/reviews", getReviews);

router.post("/review", authorizedMiddleware, canAccessCourse, reviewCourse)

export default router;
