import { Schema, model } from "mongoose";
import { ReviewSchema } from "../types/schema";

const schema = new Schema({
    text: {
        type: String,
        trim: true,
        default: "",
        maxlength: 512,
    },
    courseID: {
        type: Schema.Types.ObjectId,
        ref: "Course",
    },
    point: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: Date,
});

const ReviewModel = model<ReviewSchema>("Review", schema);

export default ReviewModel;