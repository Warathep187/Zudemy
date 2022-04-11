import { Schema, model } from "mongoose";
import {NotificationSchema} from "../types/schema";

const schema = new Schema({
    type: {
        type: String,
        enum: ["confirmation", "cancellation"]
    },
    paymentID: {
        type: Schema.Types.ObjectId,
        ref: "Payment"
    },
    courseID: {
        type: Schema.Types.ObjectId,
        ref: "Course"
    },
    toUser: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: Date
})

const NotificationModel = model<NotificationSchema>("Notification", schema);

export default NotificationModel;