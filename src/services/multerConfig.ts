import multer from "multer";
const path = require("path");

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(file.mimetype === "video/mp4") {
            cb(null, path.join(__dirname, "../files"))
        } else {
            cb(new Error("Invalid video format"), "");
        }
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})

export default multer({storage: videoStorage});