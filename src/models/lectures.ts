import { Schema, model } from "mongoose";
import {LectureSchema} from "../types/schema";

const schema = new Schema({
    title: {
        type: String,
        trim: true,
        require: true,
    },
    video: {
        key: String,
        url: String,
    },
    videoDuration: {
        type: Number,
        min: 0
    }
})

const LectureModel = model<LectureSchema>("Lecture", schema);

export default LectureModel;