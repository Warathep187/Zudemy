import { Schema, model } from "mongoose";
import {SectionSchema} from "../types/schema";

const schema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    courseID: {
        type: Schema.Types.ObjectId,
        ref: "Course"
    },
    lectures: [
        {
            type: Schema.Types.ObjectId,
            ref: "Lecture"
        }
    ],
    isPublished: {
        type: Boolean,
        default: false
    },
    createdAt: Date
})

const SectionModel = model<SectionSchema>("Section", schema);

export default SectionModel;