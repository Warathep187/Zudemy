import express from "express";
const app = express();
let server = require("http").Server(app);
const io = require("socket.io")(server);
import { Socket } from "socket.io";

import bodyParser from "body-parser";
import cors from "cors";
import { connect, Schema } from "mongoose";
require("dotenv").config();

import env from "./utils/env";

import AuthRoute from "./routes/auth";
import AdminRoute from "./routes/admin";
import UserRoute from "./routes/user";
import CourseRoute from "./routes/course";
import InstructorRoute from "./routes/instructor";

import { authorizedChecking, adminChecking, createPayment, paymentAction } from "./services/real-time-actions";
import { connectRedis, addOnlineUser, removeOnlineUser, getSocketID } from "./services/caching-actions";
import User from "./models/users";

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
app.use(cors());

app.use("/api/auth", AuthRoute);
app.use("/api/admin", AdminRoute);
app.use("/api/user", UserRoute);
app.use("/api/course", CourseRoute);
app.use("/api/instructor", InstructorRoute);

server.listen(env.PORT, async () => {
    try {
        await connect(env.MONGO_URL!);
        await connectRedis();
    } catch (e) {
        if (typeof e === "string") {
            throw new Error(e);
        }
    }
});

io.on("connection", (socket: Socket) => {
    socket.on("join", async () => {
        /// Errordddfdfdfsdfsdf
        try {
            const token = socket.handshake.headers.authorization as string;
            const { _id } = await authorizedChecking(token);
            console.log(`${_id} ${socket.id} connected`);
            await addOnlineUser(_id, socket.id);
            socket.emit("onJoined", { joined: true });
        } catch (e) {
            socket.emit("onError", { message: e });
        }
    });

    socket.on(
        "createPayment",
        async (data: { courseID: Schema.Types.ObjectId; base64Image: string; last4Digits: string }) => {
            try {
                const token = socket.handshake.headers.authorization as string;
                const { _id } = await authorizedChecking(token);
                try {
                    const newPayment = await createPayment(_id, data.courseID, data.base64Image, data.last4Digits);
                    const admin = await User.findOne({ role: "admin" }).select("_id");
                    const adminSocketID = await getSocketID(admin?._id);
                    if (adminSocketID) {
                        socket.to(adminSocketID).emit("onNewPayment", newPayment);
                    }
                    socket.emit("onPaymentCreated", { OK: true });
                } catch (e) {
                    socket.emit("onError", { message: e });
                }
            } catch (e) {
                socket.emit("onError", { message: e });
            }
        }
    );

    socket.on("confirmPayment", async (data: { paymentID: string }) => {
        try {
            const token = socket.handshake.headers.authorization as string;
            await adminChecking(token);
            try {
                const notification = await paymentAction(data.paymentID, "confirm");
                const userSocketIDs = await getSocketID(notification.toUser.toString());
                if (!userSocketIDs) {
                    await User.updateOne({ _id: notification.toUser }, { $inc: { unreadNotification: 1 } });
                } else {
                    socket.to(userSocketIDs).emit("onNewNotification", notification);
                }
                socket.emit("onPaymentActions", {
                    type: "Confirmed",
                    OK: true,
                });
            } catch (e) {
                socket.emit("onError", { message: e });
            }
        } catch (e) {
            socket.emit("onError", { message: e });
        }
    });

    socket.on("cancelPayment", async (data: { paymentID: string }) => {
        try {
            const token = socket.handshake.headers.authorization as string;
            await adminChecking(token);
            try {
                const notification = await paymentAction(data.paymentID, "cancel");
                const userSocketIDs = await getSocketID(notification.toUser.toString());
                if (!userSocketIDs) {
                    await User.updateOne({ _id: notification.toUser }, { $inc: { unreadNotification: 1 } });
                } else {
                    socket.to(userSocketIDs).emit("onNewNotification", notification);
                }
                socket.emit("onPaymentActions", {
                    type: "Confirmed",
                    OK: true,
                });
            } catch (e) {
                socket.emit("onError", { message: e });
            }
        } catch (e) {
            socket.emit("onError", { message: e });
        }
    });

    socket.on("disconnect", async () => {
        try {
            const token = socket.handshake.headers.authorization as string;
            const { _id } = await authorizedChecking(token);
            await removeOnlineUser(_id, socket.id);
        } catch (e) {
            throw new Error("Something went wrong");
        }
    });
});

export default app;
