import {Image} from "./media";

export interface UserNavbarInformation {
    _id: string;
    username: string;
    profileImage:Image;
    unreadNotification: number;
    role: string;
}

type Contact = {
    email: string;
    facebook: string;
    website: string;
}

export interface InstructorUpdateInput {
    username: string;
    firstName: string;
    lastName: string;
    aboutMe: string;
    contact: Contact;
}

export type UserSocket = {
    userID: string;
    socketIDs: string[];
}

export type OnlineUsers = {
    [_id1: string]: string;
}