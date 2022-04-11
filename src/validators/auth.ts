import { Request, Response, NextFunction } from "express";
import { emailRegex } from "../utils/regex";

export const signupValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, confirm } = req.body as {
            email: string;
            password: string;
            confirm: string;
        };

        if (!email || email.trim() === "") {
            res.status(400).send({
                message: "Email must be provided",
            });
        } else if (!emailRegex.test(email.trim())) {
            res.status(400).send({
                message: "Email is invalid",
            });
        } else if (!password || password.trim() === "") {
            res.status(400).send({
                message: "Password must be provided",
            });
        } else if (password.trim().length < 8) {
            res.status(400).send({
                message: "Password must be at least 8 characters",
            });
        } else if (password.includes(" ")) {
            res.status(400).send({
                message: "Password must not contain spaces"
            })
        } else if(!confirm || (password.trim() !== confirm.trim())) {
            res.status(400).send({
                message: "Password does not match"
            })
        } else {
            next();
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email, password} = req.body;
        if(!email || email.trim() === "") {
            res.status(400).send({
                message: "Email must be provided"
            })
        } else if(password && password.trim() === "") {
            res.status(400).send({
                message: "Password must be provided"
            })
        } else if(!emailRegex.test(email) || password.trim().length < 8) {
            res.status(400).send({
                message: "Email or password is incorrect"
            })
        } else {
            next();
        }
    }catch(e) {
        res.status(500).send({
            message: "Something went wrong",
        })
    }
}

export const resetPasswordValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {token, password, confirm} = req.body as {token: string; password: string; confirm: string;};
        if(!token || token.trim() === "") {
            res.status(400).send({
                message: "Invalid token",
            })
        } else if (!password || password.trim() === "") {
            res.status(400).send({
                message: "Password must be provided",
            });
        } else if (password.trim().length < 8) {
            res.status(400).send({
                message: "Password must be at least 8 characters",
            });
        } else if (password.includes(" ")) {
            res.status(400).send({
                message: "Password must not contain spaces"
            })
        } else if(!confirm || (password.trim() !== confirm.trim())) {
            res.status(400).send({
                message: "Password does not match"
            })
        } else {
            next();
        }
    }catch(e) {
        res.status(500).send({
            message: "Something went wrong"
        })
    }
}