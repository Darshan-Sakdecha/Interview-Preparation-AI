import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
});

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    try {
        const formData = new FormData();
        formData.append("jobDescription", jobDescription);
        formData.append("selfDescription", selfDescription);
        formData.append("resume", resumeFile);

        const response = await api.post("/api/v1/interview", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error) {
        console.log("generateInterviewReport error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    try {
        const response = await api.get(`/api/v1/interview/report/${interviewId}`);
        return response.data;
    } catch (error) {
        console.log("getInterviewReportById error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    try {
        const response = await api.get("/api/v1/interview");
        return response.data;
    } catch (error) {
        console.log("getAllInterviewReports error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    try {
        const response = await api.post(`/api/v1/interview/resume/pdf/${interviewReportId}`, null, {
            responseType: "blob",
        });

        return response.data;
    } catch (error) {
        console.log("generateResumePdf error:", error.response?.data || error.message);
        throw error;
    }
};
