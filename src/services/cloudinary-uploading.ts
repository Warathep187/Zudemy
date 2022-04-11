import { v2 as cloudinary } from "cloudinary";
import env from "../utils/env";
import { nanoid } from "nanoid";
import { Video } from "../types/media";

cloudinary.config({
    cloud_name: env.CLOUDINARY_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_SECRET_KEY,
});

export const uploadImage = async (base64Image: string, album: string): Promise<{ url: string; public_id: string }> | never => {
    return new Promise(async (resolve, reject) => {
        try {
            const image = await cloudinary.uploader.upload(base64Image, {
                public_id: nanoid(16),
                folder: `ZudemyStorage/${album}`,
            });
            resolve(image);
        } catch (e) {
            reject(e);
        }
    });
};

export const removeImage = async (imageKey: string) => {
    await cloudinary.uploader.destroy(imageKey);
};

export const removeVideo = async (videoKey: string) => {
    await cloudinary.uploader.destroy(videoKey, {
        resource_type: "video",
    });
}

export const uploadVideo = async (fileLocation: string): Promise<{ public_id: string; url: string }> => {
    return new Promise(async (resolve, reject) => {
        try {
            const uploadedVideo = await cloudinary.uploader.upload(fileLocation, {
                resource_type: "video",
                public_id: nanoid(16),
                folder: "ZudemyStorage/lecture-videos",
                chunk_size: 6000000,
            });
            resolve(uploadedVideo);
        } catch (e) {
            reject(e);
        }
    });
};

export const removeMultipleImages = async (list: { video: Video }[]) => {
    try {
        if (list.length === 0) {
            return;
        }
        const { video } = list[list.length - 1];
        await cloudinary.uploader.destroy(video.key, {
            resource_type: "video",
        });
        list.pop();
        await removeMultipleImages(list);
    } catch (e) {
        throw new Error("Error Removing");
    }
};
