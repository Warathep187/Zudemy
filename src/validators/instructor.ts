import {Request, Response, NextFunction} from "express";
import {InstructorUpdateInput} from "../types/user";
import {emailRegex, URLRegex} from "../utils/regex";

export const updateProfileValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {username, firstName, lastName, aboutMe, contact} = req.body as InstructorUpdateInput;
        if(!username || username.trim() === "") {
            res.status(400).send({
                message: "Username is required"
            })
        } else if(username.trim().length > 32) {
            res.status(400).send({
                message: "Username must be less than 32 characters"
            })
        } else if(!firstName || firstName.trim() === "") {
            res.status(400).send({
                message: "First name is required"
            })
        } else if(!lastName || lastName.trim() === "") {
            res.status(400).send({
                message: "Last name is required"
            })
        } else if(!aboutMe || aboutMe.trim() === "") {
            res.status(400).send({
                message: "You must be enter information about yourself"
            })
        } else {
            const {email, facebook, website} = contact;
            if(email.length > 0 && !emailRegex.test(email)) {
                res.status(400).send({
                    message: "Email is invalid"
                })
            } else if(facebook.length > facebook.trim().length) {
                res.status(400).send({
                    message: "Facebook must be text"
                })
            } else if(website.length > 0 && !URLRegex.test(website)) {
                res.status(400).send({
                    message: "Invalid website"
                })
            } else {
                next();
            }
        }
    }catch(e) {
        res.status(500).send({
            message: "Something went wrong"
        })
    }
}