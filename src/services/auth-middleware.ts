import { cacheLoggedInUserID, checkIsUserInCache } from "./caching-actions";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../utils/env";
import User from "../models/users";
import Course from "../models/courses";
import { CourseSchema } from "../types/schema";
import { Schema } from "mongoose";

export const authorizedMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Unauthorized");
        } else {
            try {
                const decoded = jwt.verify(token, env.JWT_AUTHENTICATION) as { _id: string } | undefined;
                const isInCache = await checkIsUserInCache(decoded!._id);
                if (isInCache) {
                    req.body.user = {
                        _id: decoded!._id,
                    };
                    next();
                } else {
                    const user = await User.findOne({ _id: decoded!._id, isVerified: true }).select("_id");
                    if (!user) {
                        throw new Error("Unauthorized");
                    } else {
                        req.body.user = {
                            _id: decoded!._id,
                        };
                        next();
                        cacheLoggedInUserID(decoded!._id);
                    }
                }
            } catch (e) {
                res.status(401).send({
                    message: "Unauthorized",
                });
            }
        }
    } catch (e) {
        res.status(401).send({
            message: "Unauthorized",
        });
    }
};

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Access denied");
        } else {
            try {
                const decoded = jwt.verify(token, env.JWT_AUTHENTICATION) as { _id: string } | undefined;
                const user = await User.findOne({
                    _id: decoded!._id,
                    isVerified: true,
                    role: "admin",
                }).select("_id");
                if (!user) {
                    throw new Error("Access denied");
                } else {
                    req.body.user = {
                        _id: decoded!._id,
                    };
                    next();
                }
            } catch (e) {
                throw new Error("Access denied");
            }
        }
    } catch (e) {
        res.status(403).send({
            message: "Access denied",
        });
    }
};

export const instructorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Access denied");
        } else {
            try {
                const decoded = jwt.verify(token, env.JWT_AUTHENTICATION) as { _id: string } | undefined;
                const user = await User.findOne({
                    _id: decoded!._id,
                    isVerified: true,
                    role: "instructor",
                }).select("_id");
                if (!user) {
                    throw new Error("Access denied");
                } else {
                    req.body.user = {
                        _id: decoded!._id,
                    };
                    next();
                }
            } catch (e) {
                throw new Error("Access denied");
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Access denied",
        });
    }
};

export const publicMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            next();
        } else {
            try {
                const decoded = jwt.verify(token, env.JWT_AUTHENTICATION) as { _id: string } | undefined;
                req.body.user = {
                    _id: decoded!._id,
                };
                next();
            } catch (e) {
                next();
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const canAccessCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { _id } = req.body.user as { _id: Schema.Types.ObjectId };
        const courseID = (req.body.courseID || req.query.courseID || req.params.id) as unknown as string | undefined;
        if (courseID) {
            const course: CourseSchema | null = await Course.findOne({ _id: courseID }).select("students");
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
                    next();
                }
            }
        } else {
            res.status(404).send({
                message: "Course not found",
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
