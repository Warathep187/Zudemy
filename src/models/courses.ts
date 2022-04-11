import {Schema, model} from "mongoose";
import {CourseSchema} from "../types/schema";

const schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 128,
        unique: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 1024
    },
    thingsToLearn: {
        type: [String],
        default: [],
    },
    coverImage: {
        key: String,
        url: String
    },
    instructor: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    students: {
        type: [{type: Schema.Types.ObjectId, ref: "User"}],
    },
    review: {
        sum: {
            type: Number,
            default: 0,
        },
        reviews: {
            type: Number,
            default: 0
        },
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    createdAt: Date,
    updatedAt: Date
}) 

const CourseModel = model<CourseSchema>("Course", schema);

export default CourseModel;