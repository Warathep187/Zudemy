import { createClient } from "redis";
import env from "../utils/env";

const client = createClient({
    url: env.REDIS_URL,
});

export const connectRedis = async () => {
    return new Promise(async (resolve, reject): Promise<void> => {
        try {
            await client.connect();
        } catch (e) {
            reject(e);
        }
    });
};

export const cacheLoggedInUserID = async (_id: string) => {
    try {
        await client.sAdd("UserIDs", _id);
    } catch (e) {
        console.log(e);
    }
};

export const checkIsUserInCache = (_id: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            const userIDs: string[] = await client.sMembers("UserIDs");
            resolve(userIDs.includes(_id));
        } catch (e) {
            reject(e);
        }
    });
};

export const removeIDInCache = async (_id: string) => {
    try {
        await client.sRem("UserIDs", _id);
    } catch (e) {
        console.log(e);
    }
};

// Real-time actions

export const removeOnlineUser = (_id: string, socketID: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const socketIDs = await client.hGet("OnlineUsers", _id);
            if(!socketIDs) {
                resolve({ OK: true });
            }else {
                let socketIDsList: string[] = JSON.parse(socketIDs!);
                if(socketIDsList.length > 1) {
                    socketIDsList = socketIDsList.filter((id: string) => id !== socketID);
                    await client.hSet("OnlineUsers", _id, JSON.stringify(socketIDsList));
                    resolve({ OK: true });
                } else {
                    await client.hDel("OnlineUsers", _id);
                    resolve({ OK: true });
                }
            }
        } catch (e) {
            reject(e);
        }
    });
};

export const addOnlineUser = (_id: string, socketID: string, ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const socketIDs = await client.hGet("OnlineUsers", _id);
            if(!socketIDs) {
                await client.hSet("OnlineUsers", _id, JSON.stringify([socketID]));
                resolve();
            } else {
                const socketIDsList: string[] = JSON.parse(socketIDs);
                if(!socketIDsList.includes(socketID)) {
                    socketIDsList.push(socketID);
                    await client.hDel("OnlineUsers", _id);
                    await client.hSet("OnlineUsers", _id, JSON.stringify(socketIDsList.slice(-3)));
                    resolve();
                } else {
                    resolve();
                }
            }
        } catch (e) {
            reject(e);
        }
    });
};

export const getSocketID = (_id: string): Promise<string[] | undefined> => {
    return new Promise(async (resolve, reject) => {
        try {
            const socketIDs = await client.hGet("OnlineUsers", _id);
            if(!socketIDs) {
                resolve(undefined);
            } else {
                const socketIDsList: string[] = JSON.parse(socketIDs);
                resolve(socketIDsList);
            }
        } catch (e) {
            reject(e);
        }
    });
};
