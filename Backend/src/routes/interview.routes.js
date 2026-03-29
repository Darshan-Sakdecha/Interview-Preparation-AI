import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
    generateInterviewReport,
    getAllInterviewReports,
    getInterviewReportById,
    generateResumePdf,
} from "../controllers/interview.controller.js";
import { upload } from "../middlewares/file.middleware.js";

const interviewRouter = express.Router();

interviewRouter.post("/", authUser, upload.single("resume"), generateInterviewReport);
interviewRouter.get("/report/:interviewId", authUser, getInterviewReportById);
interviewRouter.get("/", authUser, getAllInterviewReports);
interviewRouter.post("/resume/pdf/:interviewReportId", authUser, generateResumePdf);

export { interviewRouter };