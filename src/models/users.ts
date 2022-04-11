import { Schema, model } from "mongoose";
import { UserSchema } from "../types/schema";
import env from "../utils/env";

const schema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        maxlength: 32,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["instructor", "student", "admin"],
        default: "student",
    },
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
        default: "",
    },
    securityCode: {
        type: String,
        default: "",
    },
    profileImage: {
        url: {
            type: String,
            default: env.DEFAULT_PROFILE_IMAGE,
        },
        key: {
            type: String,
            default: "",
        },
    },
    aboutMe: {
        type: String,
        default: "",
    },
    contact: {
        email: {
            type: String,
            default: "",
        },
        facebook: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
    },
    purchasedCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    unreadNotification: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdAt: Date
});

const UserModel = model<UserSchema>("User", schema);

export default UserModel;
