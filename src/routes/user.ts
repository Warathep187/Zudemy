import { Router } from "express";
const router = Router();
import { authorizedMiddleware, canAccessCourse } from "../services/auth-middleware";
import {
    profile,
    getNavbarInformation,
    updateProfile,
    uploadProfileImage,
    removeProfileImage,
    changePassword,
    addToWishlist,
    removeFromWishlist,
    wishlist,
    learningCourses,
    learningCourse,
    getNotifications,
    readNotifications
} from "../controllers/user";
import { changePasswordValidator } from "../validators/user";
import rateLimiter from "../services/rateLimit";

router.get("/profile", authorizedMiddleware, profile);

router.get("/nav-information", authorizedMiddleware, getNavbarInformation);

router.put("/profile/update", authorizedMiddleware, updateProfile);

router.put(
    "/profile/upload-image",
    rateLimiter(1, 5, "Too many update profile image. Please try again later"),
    authorizedMiddleware,
    uploadProfileImage
);

router.put("/profile/remove-image", authorizedMiddleware, removeProfileImage);

router.put("/change-password", authorizedMiddleware, changePasswordValidator, changePassword);

router.put("/wishlist/add", authorizedMiddleware, addToWishlist);

router.put("/wishlist/remove", authorizedMiddleware, removeFromWishlist);

router.get("/wishlist", authorizedMiddleware, wishlist);

router.get("/courses", authorizedMiddleware, learningCourses);

router.get("/courses/learning/:id", authorizedMiddleware, canAccessCourse, learningCourse);

router.get("/notifications", authorizedMiddleware, getNotifications);

router.put("/notifications/read", authorizedMiddleware, readNotifications);

export default router;
