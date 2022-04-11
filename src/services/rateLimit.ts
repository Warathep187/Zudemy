import rateLimit from "express-rate-limit";

const requestLimiter = (minute: number, max: number, message: string) => {
    return rateLimit({
        windowMs:  minute * 60 * 1000,
        max: max,
        message: {
            message: message
        },
        standardHeaders: true,
        legacyHeaders: false,
    })
}

export default requestLimiter;