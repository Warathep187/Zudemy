import { Schema, model } from "mongoose";
import {QuestionSchema} from "../types/schema";

const schema = new Schema({
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 512
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    courseID: {
        type: Schema.Types.ObjectId,
        ref: "Course",
    },
    sectionID: {
        type: Schema.Types.ObjectId,
        ref: "Section",
    },
    createdAt: Date
})

const QuestionModel = model<QuestionSchema>("Question", schema);

export default QuestionModel;