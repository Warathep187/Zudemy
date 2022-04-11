import { Schema, model } from "mongoose";
import {AnswerSchema} from "../types/schema";

const schema = new Schema({
    text: {
        type: String,
        trim: true,
        required: true,
        maxlength: 512
    },
    questionID: {
        type: Schema.Types.ObjectId,
        ref: "Question"
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: Date
})

const AnswerModel = model<AnswerSchema>("Answer", schema);

export default AnswerModel;