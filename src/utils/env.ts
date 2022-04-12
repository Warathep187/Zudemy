const isDev = process.env.MODE === "development";

const environment = {
    PORT: isDev ? process.env.PORT_DEV!: process.env.PORT!,
    MONGO_URL: isDev ? process.env.MONGO_URL_DEV! : process.env.MONGO_URL!,
    REDIS_URL: isDev ? process.env.REDIS_URL_DEV!: process.env.REDIS_URL!,

    SENDER_EMAIL: isDev ? process.env.SENDER_EMAIL_DEV! : process.env.SENDER_EMAIL!,

    CLIENT_URL: isDev ? process.env.CLIENT_URL_DEV!: process.env.CLIENT_URL!,

    DEFAULT_PROFILE_IMAGE: isDev ? process.env.DEFAULT_PROFILE_IMAGE_DEV!: process.env.DEFAULT_PROFILE_IMAGE!,

    JWT_EMAIL_VERIFICATION: isDev ? process.env.JWT_EMAIL_VERIFICATION_DEV!: process.env.JWT_EMAIL_VERIFICATION!,
    JWT_AUTHENTICATION: isDev ? process.env.JWT_AUTHENTICATION_DEV!: process.env.JWT_AUTHENTICATION!,
    JWT_PASSWORD_RESETTING: isDev ? process.env.JWT_PASSWORD_RESETTING_DEV!: process.env.JWT_PASSWORD_RESETTING!,

    CLOUDINARY_NAME: isDev ? process.env.CLOUDINARY_NAME_DEV!: process.env.CLOUDINARY_NAME!,
    CLOUDINARY_API_KEY: isDev ? process.env.CLOUDINARY_API_KEY_DEV!: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_SECRET_KEY: isDev ? process.env.CLOUDINARY_SECRET_KEY_DEV!: process.env.CLOUDINARY_SECRET_KEY!,

    PROMPT_PAY_ID: isDev ? process.env.PROMPT_PAY_ID_DEV!: process.env.PROMPT_PAY_ID!,

    ADMIN_ID: isDev ? process.env.ADMIN_ID_DEV!: process.env.ADMIN_ID!
}

export default environment;