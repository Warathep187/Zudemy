import { Image, Video } from "./media";
import { Schema, Document } from "mongoose";

export interface UserSchema extends Document {
    username: string;
    email: string;
    password: string;
    isVerified: boolean;
    role: string;
    firstName: string;
    lastName: string;
    securityCode: string;
    profileImage: Image;
    aboutMe: string;
    contact: {
        email: string;
        facebook: string;
        website: string;
    };
    purchasedCourses: Schema.Types.ObjectId[];
    wishlist: Schema.Types.ObjectId[];
    unreadNotification: number;
    createdAt: Date;
}

export interface CourseSchema extends Document {
    name: string;
    description: string;
    coverImage: Image;
    thingsToLearn: string[];
    instructor: Schema.Types.ObjectId;
    isPaid: boolean;
    price: number;
    students: Schema.Types.ObjectId[];
    review: {
        sum: number;
        reviews: number;
    };
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SectionSchema extends Document {
    title: string;
    courseID: Schema.Types.ObjectId;
    lectures: Schema.Types.ObjectId[];
    isPublished: boolean;
    createdAt: Date
}

export interface LectureSchema extends Document {
    title: string;
    video: Video;
    videoDuration: number;
}

export interface PaymentSchema extends Document {
    createdBy: Schema.Types.ObjectId;
    courseID: Schema.Types.ObjectId;
    slipImage: Image;
    last4Digits: string;
    status: string;
    createdAt: Date;
}

export interface NotificationSchema extends Document {
    type: string;
    paymentID?: Schema.Types.ObjectId;
    courseID?: Schema.Types.ObjectId;
    toUser: Schema.Types.ObjectId;
    createdAt: Date;
}

export interface QuestionSchema extends Document {
    text: string;
    createdBy: Schema.Types.ObjectId;
    courseID: Schema.Types.ObjectId;
    sectionID?: Schema.Types.ObjectId;
    createdAt: Date;
}

export interface AnswerSchema extends Document {
    text: string;
    questionID: Schema.Types.ObjectId;
    createdBy: Schema.Types.ObjectId;
    createdAt: Date;
}

export interface ReviewSchema extends Document {
    text: string;
    courseID: Schema.Types.ObjectId;
    point: number;
    createdBy: Schema.Types.ObjectId;
    createdAt: Date;
}