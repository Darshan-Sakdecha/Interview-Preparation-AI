import { PDFParse } from "pdf-parse";
import {
    generateInterviewReport as generateInterviewReportByAI,
    generateResumePdf as generateResumePdfByAI,
} from "../services/ai.service.js";
import { InterviewReport } from "../models/interviewReport.model.js";

const generateInterviewReport = async (req, res) => {
    let parser;

    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Resume file is required",
            });
        }

        const { selfDescription, jobDescription } = req.body;

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required",
            });
        }

        parser = new PDFParse({
            data: req.file.buffer,
        });

        const pdfData = await parser.getText();
        const resumeContent = pdfData.text?.trim();

        if (!resumeContent) {
            return res.status(400).json({
                message: "Could not extract text from the uploaded PDF",
            });
        }

        const interviewReportByAi = await generateInterviewReportByAI({
            resume: resumeContent,
            selfDescription,
            jobDescription,
        });

        const interviewReport = await InterviewReport.create({
            user: req.user.id,
            resume: resumeContent,
            selfDescription,
            jobDescription,
            ...interviewReportByAi,
        });

        return res.status(201).json({
            message: "Interview Report generated successfully",
            interviewReport,
        });
    } catch (error) {
        console.error("Error generating interview report:", error);

        const status =
            error?.status ||
            error?.code ||
            error?.error?.code ||
            error?.response?.status;

        if (Number(status) === 503) {
            return res.status(503).json({
                message: "AI service is temporarily busy. Please try again shortly.",
                error: error.message,
            });
        }

        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    } finally {
        if (parser) {
            try {
                await parser.destroy();
            } catch (destroyError) {
                console.error("PDF parser destroy error:", destroyError.message);
            }
        }
    }
};

const getInterviewReportById = async (req, res) => {
    try {
        const { interviewId } = req.params;

        const interviewReport = await InterviewReport.findOne({
            _id: interviewId,
            user: req.user.id,
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found.",
            });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport,
        });
    } catch (error) {
        console.error("Error fetching interview report by id:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

const getAllInterviewReports = async (req, res) => {
    try {
        const interviewReports = await InterviewReport.find({
            user: req.user.id,
        })
            .sort({ createdAt: -1 })
            .select(
                "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan"
            );

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports,
        });
    } catch (error) {
        console.error("Error fetching all interview reports:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

const generateResumePdf = async (req, res) => {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await InterviewReport.findOne({
            _id: interviewReportId,
            user: req.user.id,
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found.",
            });
        }

        const pdfBuffer = await generateResumePdfByAI({
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescription,
            jobDescription: interviewReport.jobDescription,
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=resume_${interviewReportId}.pdf`
        );

        return res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating resume pdf:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

export {
    generateInterviewReport,
    getInterviewReportById,
    getAllInterviewReports,
    generateResumePdf,
};