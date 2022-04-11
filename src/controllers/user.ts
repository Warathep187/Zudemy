import User from "../models/users";
import Course from "../models/courses";
import Section from "../models/sections";
import Notification from "../models/notifications";
import { Request, Response } from "express";
import { UserNavbarInformation } from "../types/user";
import { UserSchema, CourseSchema } from "../types/schema";
import { base64Regex } from "../utils/regex";
import env from "../utils/env";
import bcrypt from "bcrypt";
import { uploadImage, removeImage } from "../services/cloudinary-uploading";
import { Schema } from "mongoose";

export const profile = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const user: UserSchema | null = await User.findById(_id).select("_id username email role profileImage");
        res.status(200).send({
            user,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getNavbarInformation = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const user: UserNavbarInformation | null = await User.findById(_id).select(
            "_id username profileImage role unreadNotification"
        );
        res.status(200).send({
            user,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { username } = req.body as { username: string };

        if (!username || username.trim() === "") {
            res.status(400).send({
                message: "Username must be provided",
            });
        } else if (username.trim().length > 32) {
            res.status(400).send({
                message: "Username must be less than 32 characters",
            });
        } else {
            const user: UserSchema | null = await User.findOne({
                username: username.trim(),
            }).select("_id");
            if (!user) {
                await User.updateOne({ _id }, { $set: { username } });
                res.status(204).send();
            } else {
                if (_id === user._id.toString()) {
                    res.status(204).send();
                } else {
                    res.status(409).send({
                        message: "Username already in used",
                    });
                }
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { base64Image } = req.body as { base64Image: string };
        if (!base64Regex.test(base64Image.replace(/^data:image\/\w+;base64,/, ""))) {
            res.status(400).send({
                message: "Invalid image format",
            });
        } else {
            const type = base64Image.split(";")[0].split("/")[1];
            if (!["jpeg", "png"].includes(type)) {
                res.status(400).send({
                    message: "Invalid image type",
                });
            } else {
                try {
                    const uploadedImage = await uploadImage(base64Image, "profile-images");
                    res.status(201).send({
                        key: uploadedImage.public_id,
                        url: uploadedImage.url,
                    });
                    const user: UserSchema | null = await User.findById(_id).select("profileImage");
                    if (user?.profileImage.key) {
                        await removeImage(user?.profileImage.key);
                    }
                    user!.profileImage = { key: uploadedImage.public_id, url: uploadedImage.url };
                    await user?.save();
                } catch (e) {
                    res.status(400).send({
                        message: "Could not upload image",
                    });
                }
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const removeProfileImage = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const user: UserSchema | null = await User.findById(_id).select("profileImage");
        if (!user?.profileImage.key) {
            res.status(409).send({
                message: "Nothing to remove",
            });
        } else {
            await removeImage(user?.profileImage.key);
            res.status(201).send({
                defaultImageUrl: env.DEFAULT_PROFILE_IMAGE,
            });
            user.profileImage.key = "";
            user.profileImage.url = env.DEFAULT_PROFILE_IMAGE;
            await user.save();
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { password } = req.body as { password: string };
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        await User.updateOne({ _id }, { $set: { password: hashedPassword } });
        res.status(204).send();
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const addToWishlist = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { courseID } = req.body as { courseID: Schema.Types.ObjectId };
        const course: CourseSchema | null = await Course.findOne({ _id: courseID, isPublished: true }).select("_id");
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else {
            const user: UserSchema | null = await User.findById(_id).select("wishlist purchasedCourses");
            if (user?.wishlist.includes(courseID)) {
                res.status(409).send({
                    message: "Course already in your wishlist",
                });
            } else if (user?.purchasedCourses.includes(courseID)) {
                res.status(409).send({
                    message: "You already bought this course",
                });
            } else {
                user?.wishlist.push(courseID);
                await user?.save();
                res.status(204).send();
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { courseID } = req.body as { courseID: Schema.Types.ObjectId };
        const course: CourseSchema | null = await Course.findOne({ _id: courseID, isPublished: true }).select("_id");
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else {
            const user: UserSchema | null = await User.findById(_id).select("wishlist");
            if (!user?.wishlist.includes(courseID)) {
                res.status(409).send({
                    message: "Course is not in your wishlist",
                });
            } else {
                await User.updateOne({ _id }, { $pull: { wishlist: courseID } });
                res.status(204).send();
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const wishlist = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const user: UserSchema | null = await User.findById(_id)
            .select("wishlist")
            .populate({
                path: "wishlist",
                select: "_id name coverImage instructor review isPaid price",
                populate: {
                    path: "instructor",
                    select: "firstName lastName",
                },
            });
        res.status(200).send({
            wishlist: user?.wishlist,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const learningCourses = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const sort = req.query.sort ? req.query.sort : "desc";
        const user = await User.findById(_id)
            .select("_id purchasedCourses")
            .populate("purchasedCourses", "_id name coverImage")
            .sort({ createdAt: sort === "desc" ? -1 : 1 });
        res.status(200).send({
            courses: user?.purchasedCourses,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const learningCourse = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: Schema.Types.ObjectId };
        const { id } = req.params as { id: string };
        const course = await Course.findOne({ _id: id }).select("students");
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else {
            if (!course.students.includes(_id)) {
                res.status(403).send({
                    message: "Access denied",
                });
            } else {
                const sections = await Section.find({ courseID: id })
                    .select("-isPublished -courseID")
                    .populate("lectures", "_id title video videoDuration");
                res.status(200).send({
                    sections,
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const notifications = await Notification.find({ toUser: _id })
            .populate({
                path: "paymentID",
                select: "_id courseID status createdAt",
                populate: {
                    path: "courseID",
                    select: "_id name coverImage",
                },
            })
            .sort({ createdAt: -1 });
        res.status(200).send({
            notifications,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const readNotifications = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        await User.updateOne({ _id }, { $set: { unreadNotification: 0 } });
        res.status(204).send();
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
