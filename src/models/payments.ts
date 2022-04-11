import { Schema, model } from "mongoose";
import { PaymentSchema } from "../types/schema";

const schema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    courseID: {
        type: Schema.Types.ObjectId,
        ref: "Course",
    },
    slipImage: {
        key: String,
        url: String,
    },
    last4Digits: {
        type: String,
        maxlength: 4,
        required: true,
    },
    status: {
        type: String,
        enum: ["waiting", "confirmed", "canceled"],
        default: "waiting",
    },
    createdAt: Date
});

const PaymentModel = model<PaymentSchema>("Payment", schema);

export default PaymentModel;
