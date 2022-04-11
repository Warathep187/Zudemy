import User from "../models/users";
import Course from "../models/courses";
import Payment from "../models/payments";
import { Request, Response } from "express";
import { UserSchema, CourseSchema } from "../types/schema";
import {addOnlineUser} from "../services/caching-actions";

export const adminGetUsers = async (req: Request, res: Response) => {
    try {
        const skip: number = req.query.skip ? +req.query.skip : 0;
        const users: UserSchema[] = await User.find({
            $or: [{ role: { $ne: "admin" } }, { role: { $ne: "instructor" } }],
        })
            .select("_id email username profileImage createdAt role isVerified")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(10);
        res.status(200).send({
            users,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const adminSetNewInstructor = async (req: Request, res: Response) => {
    try {
        const { userID } = req.body as { userID: string };
        try {
            const user: UserSchema | null = await User.findOne({
                _id: userID,
                role: { $ne: "admin" },
            }).select("isVerified role");
            if (!user) {
                res.status(400).send({
                    message: "User not found",
                });
            } else {
                if (user.role === "instructor") {
                    res.status(409).send({
                        message: "User is now a instructor",
                    });
                } else if (!user.isVerified) {
                    res.status(409).send({
                        message: "User is not verified",
                    });
                } else {
                    user.role = "instructor";
                    await user.save();
                    res.status(204).send();
                }
            }
        } catch (e) {
            res.status(400).send({
                message: "Invalid ID",
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const adminGetUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        try {
            const user = await User.findById(id)
                .populate("purchasedCourses", "_id name coverImage")
                .select("-password -securityCode -wishlist -unreadNotification");
            if (!user) {
                res.status(404).send({
                    message: "User not found",
                });
            } else {
                if (user.role === "student") {
                    res.status(200).send({
                        user,
                    });
                } else if (user.role === "instructor") {
                    const courses: CourseSchema[] | [] = await Course.find({ instructor: id })
                        .select("name coverImage isPaid price review isPublished createdAt updatedAt")
                        .sort({ createdAt: -1 });
                    res.status(200).send({
                        user,
                        courses,
                    });
                }
            }
        } catch (e) {
            res.status(404).send({
                message: "User not found",
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const adminGetPayments = async (req: Request, res: Response) => {
    try {
        const skip: number = req.query.skip ? +req.query.skip : 0;
        const payments = await Payment.find({})
            .populate("createdBy", "_id username")
            .populate("courseID", "_id name coverImage price")
            .skip(skip)
            .limit(10)
            .sort({ createdAt: -1 });
        res.status(200).send({
            payments
        })
        await addOnlineUser("1123", "123");
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
