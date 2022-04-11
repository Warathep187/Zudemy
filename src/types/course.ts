import {Schema} from "mongoose";
import { Image } from "../types/media";
import {LectureSchema} from "./schema";

export type CourseInput = {
    courseID?: string;
    name: string;
    description: string;
    image?: string;
    isPublished: boolean;
    thingsToLearn: string[];
    isPaid: boolean;
    price: number;
};

export type CourseFetching = {
    _id: Schema.Types.ObjectId;
    name: string;
    description: string;
    thingsToLearn: string[];
    coverImage: Image;
    instructor: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    isPaid: boolean;
    price: number;
    students: string[];
    review: {
        sum: number;
        reviews: number;
    };
    createdAt: Date;
    updatedAt: Date,
};

export type SectionWithLectures = {
    _id: Schema.Types.ObjectId;
    title: string;
    lectures: LectureSchema[];
    isPublished: boolean;
    createdAt: Date;
}