import { Request, Response } from "express";
import User from "../models/users";
import { UserSchema } from "../types/schema";
import emailParams from "../utils/email-params";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import AWS from "aws-sdk";
import jwt from "jsonwebtoken";
import env from "../utils/env";
import { cacheLoggedInUserID, removeIDInCache } from "../services/caching-actions";
import { emailRegex } from "../utils/regex";
import { nanoid } from "nanoid";

AWS.config.update({
    region: "us-east-1",
});

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as { email: string; password: string };
        const user: UserSchema | null = await User.findOne({ email }).select("_id isVerified");
        if (user) {
            if (user.isVerified) {
                res.status(409).send({
                    message: "Email has been used",
                });
            } else {
                const hashedPassword = await bcrypt.hash(password.trim(), 10);
                const code = uuidv4();

                user.securityCode = code;
                user.password = hashedPassword;
                await user.save();

                const token = jwt.sign({ code }, env.JWT_EMAIL_VERIFICATION!, {
                    expiresIn: "5m",
                });
                const params = emailParams(
                    email.trim(),
                    token,
                    "Email verification",
                    "Please click the following URL to verify your email. This URL is valid for 5 minutes.",
                    "verify"
                );
                const SES = new AWS.SES({
                    apiVersion: "2010-12-01",
                })
                    .sendEmail(params)
                    .promise();
                SES.then(() =>
                    res.status(202).send({
                        message: `Email has been sent to ${email.trim()}. URL is valid for 5 minutes`,
                    })
                ).catch((e) => {
                    res.status(400).send({
                        message: `Could not send an email to ${email}`,
                    });
                });
            }
        } else {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            const code = uuidv4();
            const expiredAt = new Date();
            expiredAt.setMinutes(expiredAt.getMinutes() + 5);
            const newUser = new User({
                email,
                username: nanoid(12),
                password: hashedPassword,
                securityCode: code,
                createdAt: new Date()
            });
            await newUser.save();

            const token = jwt.sign({ code }, env.JWT_EMAIL_VERIFICATION!, {
                expiresIn: "5m",
            });
            const params = emailParams(
                email.trim(),
                token,
                "Email verification",
                "Please click the following URL to verify your email. This URL is valid for 5 minutes.",
                "verify"
            );
            const SES = new AWS.SES({
                apiVersion: "2010-12-01",
            })
                .sendEmail(params)
                .promise();
            SES.then(() =>
                res.status(202).send({
                    message: `Email has been sent to ${email.trim()}. URL is valid for 5 minutes`,
                })
            ).catch((e) => {
                console.log(e);
                res.status(400).send({
                    message: `Could not send an email to ${email}`,
                });
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const emailVerification = async (req: Request, res: Response) => {
    try {
        const { token } = req.body as { token: string };
        if (!token) {
            res.status(400).send({
                message: "Token must be provided",
            });
        } else {
            try {
                const decoded = jwt.verify(token, env.JWT_EMAIL_VERIFICATION) as { code?: string };
                const { code } = decoded;
                const user: UserSchema | null = await User.findOne({
                    securityCode: code,
                }).select("isVerified");
                if (!user) {
                    res.status(400).send({
                        message: "Invalid code",
                    });
                } else {
                    if (user.isVerified) {
                        res.status(409).send({
                            message: "Account has already been verified",
                        });
                    } else {
                        user.isVerified = true;
                        user.securityCode = "";
                        await user.save();
                        res.status(201).send({
                            message: "Verified",
                        });
                    }
                }
            } catch (e) {
                res.status(400).send({
                    message: "Token is invalid or was expired",
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as { email: string; password: string };
        const user: UserSchema | null = await User.findOne({ email, isVerified: true });
        if (!user) {
            res.status(400).send({
                message: "Email or password is incorrect",
            });
        } else {
            const isMatch: boolean = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(400).send({
                    message: "Email or password is incorrect",
                });
            } else {
                const token = jwt.sign({ _id: user._id }, env.JWT_AUTHENTICATION, {
                    expiresIn: "5d",
                });
                res.status(200).send({
                    message: "Logged In",
                    token,
                    userData: {
                        _id: user._id,
                        username: user.username,
                        profileURL: user.profileImage.url,
                        unreadNotification: user.unreadNotification,
                        role: user.role,
                    },
                });
                await cacheLoggedInUserID(user._id);
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const emailSending = async (req: Request, res: Response) => {
    try {
        const { email } = req.body as { email: string };
        if (!email || email.trim() === "") {
            res.status(400).send({
                message: "Email is required",
            });
        } else if (!emailRegex.test(email)) {
            res.status(400).send({
                message: "Email is invalid",
            });
        } else {
            const user: UserSchema | null = await User.findOne({ email, isVerified: true }).select("_id");
            if (!user) {
                res.status(400).send({
                    message: "Email not found",
                });
            } else {
                const code = uuidv4();
                const token = jwt.sign({ code }, env.JWT_PASSWORD_RESETTING, {
                    expiresIn: "3m",
                });

                user.securityCode = code;
                await user.save();

                const params = emailParams(
                    email.trim(),
                    token,
                    "Password resetting procedure",
                    "Please click the following URL to reset your password. This URL is valid for 3 minutes.",
                    "reset"
                );
                const SES = new AWS.SES({
                    apiVersion: "2010-12-01",
                })
                    .sendEmail(params)
                    .promise();
                SES.then(() =>
                    res.status(202).send({
                        message: `Email has been sent to ${email.trim()}. URL is valid for 3 minutes`,
                    })
                ).catch((e) => {
                    console.log(e);
                    res.status(400).send({
                        message: `Could not send an email to ${email}`,
                    });
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body as { token: string; password: string };
        try {
            const decoded = jwt.verify(token, env.JWT_PASSWORD_RESETTING) as { code?: string };
            const user: UserSchema | null = await User.findOne({
                securityCode: decoded!.code,
            }).select("_id");
            if (!user) {
                res.status(400).send({
                    message: "Invalid code",
                });
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                user.securityCode = "";
                user.password = hashedPassword;

                await user.save();
                res.status(204).send();
            }
        } catch (e) {
            res.status(400).send({
                message: "Token is invalid or has expired",
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        await removeIDInCache(_id);
        res.status(204).send();
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
