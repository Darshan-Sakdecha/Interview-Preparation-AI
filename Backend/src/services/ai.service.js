import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env");
}

const ai = new GoogleGenAI({ apiKey });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
    const status =
        error?.status ||
        error?.code ||
        error?.error?.code ||
        error?.response?.status;

    return [408, 429, 500, 502, 503, 504].includes(Number(status));
};

const generateWithRetry = async ({
    model,
    contents,
    maxRetries = 3,
    initialDelay = 1000,
    config,
}) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await ai.models.generateContent({
                model,
                contents,
                config,
            });
        } catch (error) {
            lastError = error;

            if (!isRetryableError(error) || attempt === maxRetries) {
                throw error;
            }

            const delay =
                initialDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 400);

            console.warn(`Retry ${attempt + 1}/${maxRetries} for ${model} after ${delay}ms`);
            await sleep(delay);
        }
    }

    throw lastError;
};

const safeJsonParse = (text) => {
    try {
        return JSON.parse(text);
    } catch {
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    }
};

const cleanQuestions = (arr = [], limit = 3) => {
    if (!Array.isArray(arr)) return [];

    return arr
        .filter(
            (item) =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item) &&
                typeof item.question === "string"
        )
        .slice(0, limit)
        .map((item) => ({
            question: item.question.trim(),
            intention:
                typeof item.intention === "string" && item.intention.trim()
                    ? item.intention.trim()
                    : "Check practical understanding",
            answer:
                typeof item.answer === "string" && item.answer.trim()
                    ? item.answer.trim()
                    : "Answer with concept and one project example",
        }));
};

const cleanSkillGaps = (arr = [], limit = 2) => {
    if (!Array.isArray(arr)) return [];

    return arr
        .filter(
            (item) =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item) &&
                typeof item.skill === "string"
        )
        .slice(0, limit)
        .map((item) => ({
            skill: item.skill.trim(),
            severity: ["low", "medium", "high"].includes(item.severity)
                ? item.severity
                : "medium",
        }));
};

const cleanPlan = (arr = [], limit = 3) => {
    if (!Array.isArray(arr)) return [];

    return arr
        .filter(
            (item) =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item) &&
                (typeof item.focus === "string" || typeof item.day === "number")
        )
        .slice(0, limit)
        .map((item, index) => ({
            day: Number(item.day) || index + 1,
            focus:
                typeof item.focus === "string" && item.focus.trim()
                    ? item.focus.trim()
                    : `Preparation Day ${index + 1}`,
            tasks:
                Array.isArray(item.tasks) && item.tasks.length > 0
                    ? item.tasks
                        .filter((task) => typeof task === "string" && task.trim())
                        .slice(0, 2)
                    : ["Revise core concepts", "Practice interview questions"],
        }));
};

const cleanInterviewData = (data, jobDescription) => {
    return {
        title: data?.title || jobDescription || "Interview Report",
        matchScore:
            typeof data?.matchScore === "number"
                ? Math.max(0, Math.min(100, data.matchScore))
                : 70,
        technicalQuestions: cleanQuestions(data?.technicalQuestions, 3),
        behavioralQuestions: cleanQuestions(data?.behavioralQuestions, 3),
        skillGaps: cleanSkillGaps(data?.skillGaps, 2),
        preparationPlan: cleanPlan(data?.preparationPlan, 3),
    };
};

const generateInterviewReport = async ({
    resume,
    jobDescription,
    selfDescription,
}) => {
    try {
        const prompt = `
You are an expert technical interviewer.

Return ONLY valid JSON.
Keep the output SHORT and USEFUL.

Rules:
- Do not return markdown
- Do not return extra explanation
- Give only:
  - 3 technicalQuestions
  - 3 behavioralQuestions
  - 2 skillGaps
  - 3 preparationPlan days
- Every array must contain OBJECTS only
- Keep answers short and practical
- Base output on the candidate profile and backend/MERN experience

JSON format:
{
  "title": "Backend Developer",
  "matchScore": 75,
  "technicalQuestions": [
    {
      "question": "...",
      "intention": "...",
      "answer": "..."
    }
  ],
  "behavioralQuestions": [
    {
      "question": "...",
      "intention": "...",
      "answer": "..."
    }
  ],
  "skillGaps": [
    {
      "skill": "...",
      "severity": "low"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "...",
      "tasks": ["...", "..."]
    }
  ]
}

Candidate Resume:
${resume.slice(0, 4000)}

Self Description:
${selfDescription || "Not provided"}

Job Description:
${jobDescription}
`;

        let response;

        try {
            response = await generateWithRetry({
                model: "gemini-2.5-flash",
                contents: prompt,
                maxRetries: 3,
                initialDelay: 1000,
            });
        } catch (error) {
            const status =
                error?.status ||
                error?.code ||
                error?.error?.code ||
                error?.response?.status;

            if (Number(status) !== 503) {
                throw error;
            }

            response = await generateWithRetry({
                model: "gemini-2.0-flash",
                contents: prompt,
                maxRetries: 2,
                initialDelay: 1500,
            });
        }

        const rawText = response.text?.trim();

        if (!rawText) {
            throw new Error("Empty response received from Gemini");
        }

        const parsed = safeJsonParse(rawText);
        return cleanInterviewData(parsed, jobDescription);
    } catch (error) {
        console.error("Interview report error:", error.message);
        throw error;
    }
};

const generatePdfFromHtml = async (htmlContent) => {
    const browser = await puppeteer.launch({
        headless: true,
    });

    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm",
            },
        });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
};

const generateResumePdf = async ({ resume, selfDescription, jobDescription }) => {
    const resumePdfSchema = z.object({
        html: z.string().describe("Full HTML content for a professional ATS-friendly resume"),
    });

    const prompt = `
Generate a professional ATS-friendly resume in pure HTML.

Candidate Resume Content:
${resume}

Self Description:
${selfDescription || "Not provided"}

Job Description:
${jobDescription}

Rules:
- Return ONLY valid JSON
- JSON must contain exactly one field: "html"
- HTML must be complete and professional
- Use inline CSS only
- Keep design simple, clean, and ATS-friendly
- Make it 1 page if possible, max 2 pages
- Include: name, summary, skills, projects, education, achievements if available
- Tailor the content to the given job description
- Do not mention AI
`;

    const response = await generateWithRetry({
        model: "gemini-2.5-flash",
        contents: prompt,
        maxRetries: 3,
        initialDelay: 1000,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
        throw new Error("Empty response received while generating resume HTML");
    }

    const parsed = safeJsonParse(rawText);

    if (!parsed?.html) {
        throw new Error("Invalid HTML response from AI");
    }

    const pdfBuffer = await generatePdfFromHtml(parsed.html);
    return pdfBuffer;
};

export { generateInterviewReport, generateResumePdf };