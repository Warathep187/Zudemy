import jwt from "jsonwebtoken";
import env from "../utils/env";
import { base64Regex } from "../utils/regex";
import Payment from "../models/payments";
import Course from "../models/courses";
import User from "../models/users";
import Notification from "../models/notifications";
import { PaymentSchema, UserSchema, NotificationSchema } from "../types/schema";
import { uploadImage } from "../services/cloudinary-uploading";
import { checkIsUserInCache } from "./caching-actions";
import { Schema } from "mongoose";

export const authorizedChecking = (token: string): Promise<{ _id: string }> => {
    return new Promise(async (resolve, reject) => {
        try {
            const decoded = jwt.verify(token, env.JWT_AUTHENTICATION) as { _id: string };
            const isInCache = await checkIsUserInCache(decoded._id);
            if (isInCache) {
                resolve(decoded);
            } else {
                const user = await User.findOne({ _id: decoded._id, isVerified: true }).select("_id");
                if (!user) {
                    reject("Unauthorized");
                } else {
                    resolve(decoded);
                }
            }
        } catch (e) {
            reject("Unauthorized");
        }
    });
};

export const adminChecking = (token: string): Promise<{ _id: string }> => {
    return new Promise(async (resolve, reject) => {
        try {
            const decoded = jwt.verify(token, env.JWT_AUTHENTICATION) as { _id: string };
            if (decoded._id === env.ADMIN_ID) {
                resolve(decoded);
            } else {
                reject("Access denied");
            }
        } catch (e) {
            reject("Access denied");
        }
    });
};

export const createPayment = async (
    _id: string,
    courseID: Schema.Types.ObjectId,
    base64Image: string,
    last4Digits: string
): Promise<PaymentSchema> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!base64Image || !base64Regex.test(base64Image.replace(/^data:image\/\w+;base64,/, ""))) {
                reject("Invalid slip image");
            } else if (!last4Digits || isNaN(+last4Digits) || last4Digits.trim().length !== 4) {
                reject("Invalid last 4 digits");
            } else {
                const course = await Course.findOne({ _id: courseID, isPublished: true }).select("_id");
                if (!course) {
                    reject("Course not found");
                } else if (!course.isPaid) {
                    reject("Course is free");
                } else {
                    const user: UserSchema | null = await User.findById(_id).select("purchasedCourses");
                    if (user?.purchasedCourses.includes(courseID)) {
                        reject("You already bought");
                    } else {
                        const payment: PaymentSchema | null = await Payment.findOne({
                            createdBy: _id,
                            courseID,
                            status: "waiting",
                        }).select("_id");
                        if (payment) {
                            reject("Please waiting for admin to confirm payment");
                        } else {
                            const uploadedImage = await uploadImage(base64Image, "slip-images");
                            const newPayment = new Payment({
                                createdBy: _id,
                                courseID: courseID,
                                slipImage: { key: uploadedImage.public_id, url: uploadedImage.url },
                                last4Digits,
                                createdAt: new Date(),
                            });
                            await newPayment.save();
                            resolve(newPayment);
                            await User.updateOne({ _id }, { $pull: { wishlist: courseID } });
                        }
                    }
                }
            }
        } catch (e) {
            reject("Something went wrong");
        }
    });
};

export const paymentAction = (paymentID: string, action: string): Promise<NotificationSchema> => {
    return new Promise(async (resolve, reject) => {
        if (action === "confirm") {
            try {
                const payment: PaymentSchema | null = await Payment.findOne({ _id: paymentID }).select(
                    "createdBy courseID status"
                );
                if (!payment) {
                    reject("Payment not found");
                } else if (payment.status === "confirmed") {
                    reject("Payment is already confirmed");
                } else {
                    payment.status = "confirmed";
                    await payment.save();
                    await User.updateOne({ _id: payment?.createdBy }, { $push: { purchasedCourse: payment.courseID } });
                    const newNotification: NotificationSchema | null = new Notification({
                        type: "confirmation",
                        paymentID: payment._id,
                        toUser: payment.createdBy,
                        createdAt: new Date(),
                    });
                    await newNotification.save();
                    resolve(newNotification);
                    await User.updateOne({ _id: payment.createdBy }, { $push: { purchasedCourses: payment.courseID } });
                    await Course.updateOne({ _id: payment.courseID }, { $push: { students: payment.createdBy } });
                }
            } catch (e) {
                reject(e);
            }
        } else {
            // action === "cancel"
            try {
                const payment: PaymentSchema | null = await Payment.findOne({ _id: paymentID }).select(
                    "createdBy courseID status"
                );
                if (!payment) {
                    reject("Payment not found");
                } else if (payment.status === "canceled") {
                    reject("Payment is already canceled");
                } else if (payment.status === "confirmed") {
                    reject("Payment is already confirmed");
                } else {
                    payment.status = "canceled";
                    await payment.save();
                    const newNotification: NotificationSchema | null = new Notification({
                        type: "cancellation",
                        paymentID: payment._id,
                        toUser: payment.createdBy,
                        createdAt: new Date(),
                    });
                    await newNotification.save();
                    resolve(newNotification);
                }
            } catch (e) {
                reject(e);
            }
        }
    });
};