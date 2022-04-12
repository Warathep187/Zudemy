import Course from "../models/courses";
import User from "../models/users";
import Section from "../models/sections";
import Lecture from "../models/lectures";
import Question from "../models/questions";
import Answer from "../models/answers";
import Review from "../models/reviews";
import { Request, Response } from "express";
import { UserSchema, CourseSchema, QuestionSchema, SectionSchema, AnswerSchema, ReviewSchema } from "../types/schema";
import { Schema } from "mongoose";
import { CourseInput, CourseFetching } from "../types/course";
import {
    uploadImage,
    removeImage,
    uploadVideo,
    removeVideo,
    removeMultipleImages,
} from "../services/cloudinary-uploading";
import { Video } from "../types/media";
const { getVideoDurationInSeconds } = require("get-video-duration");
import { unlink } from "fs";
import { base64Regex } from "../utils/regex";
import generatePayload from "promptpay-qr";
import qrcode from "qrcode";
import env from "../utils/env";

export const createCourse = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { name, description, image, thingsToLearn, isPaid, price } = <CourseInput>req.body;
        try {
            const uploadedImage = await uploadImage(image!, "course-cover-images");
            try {
                const newCourse = new Course({
                    name,
                    description,
                    coverImage: {
                        url: uploadedImage.url,
                        key: uploadedImage.public_id,
                    },
                    thingsToLearn,
                    instructor: _id,
                    isPaid,
                    price: +price,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                await newCourse.save();
                res.status(201).send({
                    message: "Created",
                    courseID: newCourse._id,
                });
            } catch (e) {
                res.status(500).send({
                    message: "Course's name has been used",
                });
            }
        } catch (e) {
            res.status(409).send({
                message: "Could not upload image",
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const courseData = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { id } = req.params as { id: string };
        const course: CourseSchema | null = await Course.findById(id).select("-review");
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else if (course.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else {
            const sections: SectionSchema[] = await Section.find({ courseID: id })
                .select("-courseID")
                .populate("lectures", "_id title video videoDuration")
                .sort({ createdAt: -1 });
            res.status(200).send({
                course,
                sections,
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { courseID, name, description, thingsToLearn, isPublished, isPaid, price } = req.body as CourseInput;
        const course: CourseSchema | null = await Course.findById(courseID).select("instructor");
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else if (course.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else {
            course.name = name;
            course.description = description;
            course.thingsToLearn = thingsToLearn;
            course.isPublished = isPublished;
            course.isPaid = isPaid;
            course.price = +price;
            course.updatedAt = new Date();
            await course.save();
            res.status(204).send();

            if (!isPublished) {
                await User.updateMany({ wishlist: { $in: courseID } }, { $pull: { wishlist: courseID } });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const uploadCourseImage = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { courseID, base64Image } = req.body as { courseID: string; base64Image: string };
        const course: CourseSchema | null = await Course.findById(courseID).select("coverImage instructor");
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else if (course.instructor.toString() !== _id) {
        } else {
            if (!base64Regex.test(base64Image.replace(/^data:image\/\w+;base64,/, ""))) {
                res.status(400).send({
                    message: "Invalid image",
                });
            } else {
                try {
                    const uploadedImage = await uploadImage(base64Image, "course-cover-images");
                    const oldKey = course.coverImage.key;
                    course.coverImage.key = uploadedImage.public_id;
                    course.coverImage.url = uploadedImage.url;
                    await course.save();
                    res.status(201).send({
                        newURL: uploadedImage.url,
                        newKey: uploadedImage.public_id,
                    });
                    removeImage(oldKey);
                } catch (e) {
                    res.status(500).send({
                        message: "Could not upload image",
                    });
                }
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const addSection = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { courseID, title } = req.body as { courseID: string; title: string };
        if (title.trim() === "") {
            res.status(400).send({
                message: "Section's title cannot be empty",
            });
        } else {
            const course: CourseSchema | null = await Course.findOne({
                _id: courseID,
                instructor: _id,
            }).select("_id");
            if (!course) {
                res.status(404).send({
                    message: "Course not found",
                });
            } else {
                const newSection = new Section({ title, courseID, lectures: [], createdAt: new Date() });
                await newSection.save();
                res.status(201).send({
                    newSection,
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const removeSection = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { courseID, sectionID } = req.body as { courseID: string; sectionID: string };

        const section: {
            _id: Schema.Types.ObjectId;
            courseID: { instructor: Schema.Types.ObjectId };
            lectures: Schema.Types.ObjectId[];
        } | null = await Section.findOne({ _id: sectionID, courseID: courseID })
            .select("_id courseID lectures")
            .populate("courseID", "instructor");

        if (!section) {
            res.status(404).send({
                message: "Section not found",
            });
        } else if (section.courseID.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else {
            await Section.deleteOne({ _id: sectionID });
            res.status(403).send();
            const lectures = (await Lecture.find({
                sectionID,
            }).select("-_id video")) as unknown as { video: Video }[];
            await Lecture.deleteMany({ _id: { $in: section.lectures } });
            removeMultipleImages(lectures);
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const publish = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { sectionID } = req.body as { sectionID: string };
        const section: {
            _id: Schema.Types.ObjectId;
            courseID: { instructor: Schema.Types.ObjectId };
            isPublished: boolean;
        } | null = await Section.findOne({ _id: sectionID })
            .select("isPublished courseID")
            .populate("courseID", "instructor");
        if (!section) {
            res.status(404).send({
                message: "Section not found",
            });
        } else if (section.courseID.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else if (section.isPublished) {
            res.status(409).send({
                message: "Section has been published",
            });
        } else {
            res.status(204).send();
            await Section.updateOne({ _id: sectionID }, { $set: { isPublished: true } });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const cancelPublish = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { sectionID } = req.body as { sectionID: string };
        const section: {
            _id: Schema.Types.ObjectId;
            courseID: { instructor: Schema.Types.ObjectId };
            isPublished: boolean;
        } | null = await Section.findOne({ _id: sectionID })
            .select("isPublished courseID")
            .populate("courseID", "instructor");
        if (!section) {
            res.status(404).send({
                message: "Section not found",
            });
        } else if (section.courseID.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else if (!section.isPublished) {
            res.status(409).send({
                message: "Section is not publish",
            });
        } else {
            res.status(204).send();
            await Section.updateOne({ _id: sectionID }, { $set: { isPublished: false } });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const addLecture = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { title, sectionID } = req.body as { title: string; sectionID: string };
        const section: {
            _id: Schema.Types.ObjectId;
            courseID: { instructor: Schema.Types.ObjectId };
            lectures: Schema.Types.ObjectId[];
        } | null = await Section.findOne({ _id: sectionID })
            .select("courseID lectures")
            .populate("courseID", "instructor");
        if (!section) {
            res.status(404).send({
                message: "Section not found",
            });
        } else if (section.courseID.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else {
            if (!title || title.trim() === "") {
                res.status(400).send({
                    message: "Title must be provided",
                });
            } else {
                const newLecture = new Lecture({ title });
                await newLecture.save();
                res.status(201).send({
                    newLecture,
                });
                await Section.updateOne({ _id: sectionID }, { $push: { lectures: newLecture._id } });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const uploadLectureVideo = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { lectureID, sectionID } = req.body as { lectureID: string; sectionID: string };
        const section: {
            _id: Schema.Types.ObjectId;
            courseID: { instructor: Schema.Types.ObjectId };
        } | null = await Section.findOne({ _id: sectionID })
            .select("courseID lectures")
            .populate("courseID", "instructor");
        if (!section) {
            res.status(404).send({
                message: "Section not found",
            });
        } else if (section.courseID.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else {
            const lecture: { _id: Schema.Types.ObjectId; video?: Video } | null = await Lecture.findOne({
                _id: lectureID,
            }).select("video");
            if (!lecture) {
                res.status(404).send({
                    message: "Lecture not found",
                });
            } else {
                try {
                    const uploadedVideo = await uploadVideo(req.file!.path);
                    const videoData = { key: uploadedVideo.public_id, url: uploadedVideo.url };
                    const duration = await getVideoDurationInSeconds(uploadedVideo.url);
                    await Lecture.updateOne(
                        { _id: lectureID },
                        {
                            $set: {
                                video: videoData,
                                videoDuration: parseInt(duration),
                            },
                        }
                    );
                    res.status(201).send({
                        message: "Uploaded",
                        newVideo: videoData,
                    });
                    if (lecture.video) {
                        removeVideo(lecture.video.key);
                    }
                    unlink(req.file!.path, () => {});
                } catch (e) {
                    res.status(500).send({
                        message: "Error video uploading",
                    });
                }
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const removeLecture = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { lectureID, sectionID } = req.body as { lectureID: string; sectionID: string };
        const section: {
            _id: Schema.Types.ObjectId;
            courseID: { instructor: Schema.Types.ObjectId };
        } | null = await Section.findOne({ _id: sectionID })
            .select("courseID lectures")
            .populate("courseID", "instructor");
        if (!section) {
            res.status(404).send({
                message: "Section not found",
            });
        } else if (section.courseID.instructor.toString() !== _id) {
            res.status(403).send({
                message: "Access denied",
            });
        } else {
            const lecture: { _id: Schema.Types.ObjectId; video?: Video } | null = await Lecture.findOne({
                _id: lectureID,
            }).select("video");
            if (!lecture) {
                res.status(404).send({
                    message: "Lecture not found",
                });
            } else {
                res.status(203).send();
                await Lecture.deleteOne({ _id: lectureID });
                await Section.updateOne({ _id: sectionID }, { $pull: { lectures: lectureID } });
                if (lecture.video) {
                    removeVideo(lecture.video.key);
                }
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const paymentPreparing = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { id } = req.params as unknown as { id: Schema.Types.ObjectId };
        const course: CourseSchema | null = await Course.findOne({ _id: id, isPublished: true }).select(
            "_id name coverImage isPaid price"
        );
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else if (!course.isPaid) {
            res.status(409).send({
                message: "Course is free",
            });
        } else {
            const user: UserSchema | null = await User.findById(_id).select("purchasedCourses");
            if (user?.purchasedCourses.includes(id)) {
                res.status(409).send({
                    message: "Course already bought",
                });
            } else {
                const payload = generatePayload(env.PROMPT_PAY_ID, { amount: course.price });
                const qrCodeSvg = await qrcode.toString(payload, {
                    type: "svg",
                    color: {
                        dark: "#000",
                        light: "#fff",
                    },
                });
                res.status(200).send({
                    course,
                    qrCodeSvg,
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        try {
            const course: CourseFetching | null = await Course.findOne({ _id: id, isPublished: true }).populate(
                "instructor",
                "_id firstName lastName"
            );
            if (!course) {
                res.status(404).send({
                    message: "Course not found",
                });
            } else {
                if (req.body.user) {
                    const { _id } = req.body.user as { _id: string };
                    const user: UserSchema | { _id: Schema.Types.ObjectId; wishlist: Schema.Types.ObjectId[] } | null =
                        await User.findById(_id).select("wishlist");
                    res.status(200).send({
                        _id: course._id,
                        name: course.name,
                        description: course.description,
                        thingsToLearn: course.thingsToLearn,
                        coverImage: course.coverImage,
                        instructor: course.instructor,
                        isPaid: course.isPaid,
                        price: course.price,
                        students: course.students.length,
                        review: course.review,
                        createdAt: course.createdAt,
                        updatedAt: course.updatedAt,
                        isBought: course.students.includes(_id),
                        isInWishlist: user!.wishlist.includes(course._id),
                    });
                } else {
                    res.status(200).send({
                        _id: course._id,
                        name: course.name,
                        description: course.description,
                        thingsToLearn: course.thingsToLearn,
                        coverImage: course.coverImage,
                        instructor: course.instructor,
                        isPaid: course.isPaid,
                        price: course.price,
                        students: course.students.length,
                        review: course.review,
                        createdAt: course.createdAt,
                        updatedAt: course.updatedAt,
                    });
                }
            }
        } catch (e) {
            res.status(404).send({
                message: "Course not found",
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getCourseSections = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const course: CourseSchema | null = await Course.findOne({ _id: id }).select("isPublished");
        if (!course) {
            res.status(404).send({
                message: "Course not found",
            });
        } else if (!course.isPublished) {
            res.status(403).send({
                message: "Access denied",
            });
        } else {
            const sections = await Section.find({ courseID: id, isPublished: true })
                .select("-isPublished")
                .populate("lectures", "-_id title")
                .sort({ createdAt: -1 });
            res.status(200).send({
                sections,
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getQuestions = async (req: Request, res: Response) => {
    try {
        const courseID = req.params.id;
        const sectionID = req.query.sectionID as unknown as string | undefined;
        let questions: QuestionSchema[];
        if (sectionID) {
            questions = await Question.find({ courseID, sectionID })
                .populate("createdBy", "_id username profileImage")
                .sort({ createdAt: -1 });
        } else {
            questions = await Question.find({ courseID })
                .populate("createdBy", "_id name profileImage")
                .sort({ createdAt: -1 });
        }
        res.status(200).send({
            questions,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const askNewQuestion = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { courseID, sectionID, text } = req.body as {
            courseID: string;
            sectionID: string | undefined;
            text: string;
        };
        if (!text || text.trim() === "") {
            res.status(400).send({
                message: "Question must be provided",
            });
        } else if (text.trim().length > 512) {
            res.status(400).send({
                message: "Question must be less than 512 characters",
            });
        } else {
            try {
                if (!sectionID) {
                    const newQuestion = new Question({ text, createdBy: _id, courseID, createdAt: new Date() });
                    await newQuestion.save();
                    res.status(201).send({
                        newQuestion,
                    });
                } else {
                    const newQuestion = new Question({
                        text,
                        createdBy: _id,
                        courseID,
                        sectionID,
                        createdAt: new Date(),
                    });
                    await newQuestion.save();
                    res.status(201).send({
                        newQuestion,
                    });
                }
            } catch (e) {
                res.status(500).send({
                    message: "Could not ask new question",
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const removeQuestion = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { id } = req.params as { id: string }; // id is question ID
        const { courseID } = req.query as { courseID: string };
        const question: QuestionSchema | null = await Question.findOne({ _id: id, courseID }).select("createdBy");
        if (!question) {
            res.status(404).send({
                message: "Question not found",
            });
        } else {
            if (question.createdBy.toString() !== _id) {
                res.status(403).send({
                    message: "Access denied",
                });
            } else {
                await Question.deleteOne({ _id: id });
                await Answer.deleteMany({ id });
                res.status(204).send();
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getAnswers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const question: QuestionSchema | null = await Question.findOne({ _id: id }).populate(
            "createdBy",
            "_id username profileImage"
        );
        if (!question) {
            res.status(404).send({
                message: "Question not found",
            });
        } else {
            const answers: AnswerSchema[] = await Answer.find({ questionID: id })
                .populate("createdBy", "_id username profileImage")
                .sort({ createdAt: -1 });
            res.status(200).send({
                question,
                answers,
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const answerQuestion = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { text, questionID } = req.body as { text: string; courseID: string; questionID: string };
        if (!text || text.trim() === "") {
            res.status(400).send({
                message: "Answer must be provided",
            });
        } else if (text.trim().length > 512) {
            res.status(400).send({
                message: "Answer must be at least 512 characters",
            });
        } else {
            const question = await Question.findOne({ _id: questionID }).select("_id");
            if (!question) {
                res.status(404).send({
                    message: "Question not found",
                });
            } else {
                const newAnswer = new Answer({ text, questionID, createdBy: _id, createdAt: new Date() });
                await newAnswer.save();
                res.status(201).send({
                    newAnswer,
                });
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const removeAnswer = async (req: Request, res: Response) => {
    try {
        const { _id } = req.body.user as { _id: string };
        const { id } = req.params as { id: string };
        if (!id) {
            res.status(404).send({
                message: "Answer not found",
            });
        } else {
            const answer: AnswerSchema | null = await Answer.findOne({ _id: id }).select("createdBy");
            if (!answer) {
                res.status(404).send({
                    message: "Answer not found",
                });
            } else if (answer.createdBy.toString() !== _id) {
                res.status(403).send({
                    message: "Access denied",
                });
            } else {
                await Answer.deleteOne({ _id: id });
                res.status(204).send();
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getReviews = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const course: CourseSchema | null = await Course.findOne({ _id: id }).select("_id");
        if (!course) {
        } else {
            const reviews: ReviewSchema[] = await Review.find({ courseID: id })
                .populate("createdBy", "_id username profileImage")
                .sort({ createdAt: -1 });
            res.status(200).send({
                reviews,
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const reviewCourse = async (req: Request, res: Response) => {
    try {
        const { courseID, text, point } = req.body as { courseID: string; text: string; point: number };
        const { _id } = req.body.user as { _id: string };
        if (text.trim().length > 512) {
            res.status(400).send({
                message: "Review must be at least 512 characters",
            });
        } else if (isNaN(+point) || +point > 5 || +point < 1) {
            res.status(400).send({
                message: "Invalid point",
            });
        } else {
            const course = await Course.findOne({ _id: courseID }).select("_id");
            if (!course) {
            } else {
                const isReviewExisting = await Review.findOne({ courseID, createdBy: _id }).select("_id");
                if (isReviewExisting) {
                    res.status(409).send({
                        message: "You already reviewed this course",
                    });
                } else {
                    const newReview = new Review({
                        text: text ? text : "",
                        courseID,
                        point: +point,
                        createdBy: _id,
                        createdAt: new Date(),
                    });
                    await newReview.save();
                    res.status(204).send();
                    await Course.updateOne({_id: courseID}, {$inc: {"review.sum": +point, "review.reviews": 1}})
                }
            }
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
