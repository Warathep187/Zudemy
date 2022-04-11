import {Request, Response, NextFunction} from "express";
import {CourseInput} from "../types/course";
import {base64Regex} from "../utils/regex";

export const createCourseValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {name, description, image, thingsToLearn, isPaid, price} = <CourseInput>req.body;
        if(!name || name.trim() === "") {
            res.status(400).send({
                message: "Course's name is required"
            })
        } else if(name.trim().length > 32) {
            res.status(400).send({
                message: "Course's name must be less than 32 characters"
            })
        } else if(!description || description.trim() === "") {
            res.status(400).send({
                message: "Description is required"
            })
        } else if(description.length > 1024) {
            res.status(400).send({
                message: "Description must be less than 1024 characters"
            })
        } else if(!base64Regex.test(image!.replace(/^data:image\/\w+;base64,/, ""))) {
            res.status(400).send({
                message: "Invalid image"
            })
        } else if(thingsToLearn.length === 0) {
            res.status(400).send({
                message: "Things to learn list must be at least 1"
            })
        } else if(thingsToLearn.length > 20) {
            res.status(400).send({
                message: "Things to learn list must be less than 20"
            })
        } else if(typeof isPaid !== "boolean") {
            res.status(400).send({
                message: "Invalid paid state"
            })
        } else if(isNaN(+price)) {
            res.status(400).send({
                message: "Price is invalid"
            })
        } else if(+price < 0) {
            res.status(400).send({
                message: "Price must be at least 0"
            })
        } else if(isPaid && +price < 1) {
            res.status(400).send({
                message: "Course is not free"
            })
        } else if(!isPaid && +price > 0) {
            res.status(400).send({
                message: "Course is not paid"
            })
        } else {
            next();
        }
    }catch(e) {
        console.log(e);
        res.status(500).send({
            message: "Something went wrong"
        })
    }
}

export const updateCourseValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {name, description, thingsToLearn, isPublished, isPaid, price} = req.body as CourseInput;
        if(!name || name.trim() === "") {
            res.status(400).send({
                message: "Course's name is required"
            })
        } else if(name.trim().length > 32) {
            res.status(400).send({
                message: "Course's name must be less than 32 characters"
            })
        } else if(!description || description.trim() === "") {
            res.status(400).send({
                message: "Description is required"
            })
        } else if(description.length > 1024) {
            res.status(400).send({
                message: "Description must be less than 1024 characters"
            })
        } else if(thingsToLearn.length === 0) {
            res.status(400).send({
                message: "Things to learn list must be at least 1"
            })
        } else if(thingsToLearn.length > 20) {
            res.status(400).send({
                message: "Things to learn list must be less than 20"
            })
        } else if(typeof isPublished !== "boolean") {
            res.status(400).send({
                message: "Invalid publish status"
            })
        } else if(typeof isPaid !== "boolean") {
            res.status(400).send({
                message: "Invalid paid state"
            })
        } else if(isNaN(+price)) {
            res.status(400).send({
                message: "Price is invalid"
            })
        } else if(+price < 0) {
            res.status(400).send({
                message: "Price must be at least 0"
            })
        } else if(isPaid && +price < 1) {
            res.status(400).send({
                message: "Course is not free"
            })
        } else if(!isPaid && +price > 0) {
            res.status(400).send({
                message: "Course is not paid"
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