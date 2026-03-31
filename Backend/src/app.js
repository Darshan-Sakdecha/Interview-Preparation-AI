import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { interviewRouter } from "./routes/interview.routes.js";

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://interview-preparation-ai-frontend.onrender.com",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/interview", interviewRouter);

export { app };