import {Request, Response, NextFunction} from "express";

export const changePasswordValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {password, confirm} = req.body as {password: string; confirm: string;};
        if (!password || password.trim() === "") {
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