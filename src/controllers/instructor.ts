import { Request, Response } from "express";
import User from "../models/users";
import Course from "../models/courses";
import { UserSchema, CourseSchema } from "../types/schema";
import { InstructorUpdateInput } from "../types/user";

export const profile = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user;
        const user: UserSchema | null = await User.findById(_id).select(
            "-password -isVerified -securityCode -purchasedCourses -wishlist -createdAt -unreadNotification"
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
        const { username, firstName, lastName, aboutMe, contact } = req.body as InstructorUpdateInput;
        const user: UserSchema | null = await User.findOne({ username: username.trim() }).select("_id");
        if (!user) {
            await User.updateOne({ _id }, { $set: { username, firstName, lastName, aboutMe, contact } });
            res.status(204).send();
        } else {
            if (_id === user._id.toString()) {
                user.username = username;
                user.firstName = firstName;
                user.lastName = lastName;
                user.aboutMe = aboutMe;
                user.contact = contact;
                await user.save();
                res.status(204).send();
            } else {
                res.status(400).send({
                    message: "Username has been used",
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const instructorProfile = async (req: Request, res: Response) => {
    try {
        const { instructor_id } = req.params as { instructor_id: string };
        const instructor: UserSchema | null = await User.findOne({
            _id: instructor_id,
            role: "instructor",
        }).select("-email -password -isVerified -securityCode -purchasedCourses -wishlist -createdAt -unreadNotification");
        if (!instructor) {
            res.status(404).send({
                message: "Instructor not found",
            });
        } else {
            const courses: CourseSchema[] = await Course.find({
                instructor: instructor_id,
                isPublished: true,
            }).select("-description -thingsToLearn -instructor -students -isPublished -createdAt");
            res.status(200).send({
                instructor,
                courses,
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const InstructorGetCourses = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const courses: CourseSchema[] = await Course.find({ instructor: _id })
            .select("_id name coverImage isPaid price review isPublished createdAt")
            .sort({ createdAt: -1 });
        res.status(200).send({
            courses,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
