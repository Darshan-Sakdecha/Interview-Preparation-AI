import express from "express";
import { getMe, loginUser, logoutUser, registerUser } from "../controllers/auth.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();


authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/logout",authUser, logoutUser);
authRouter.get("/get-me", authUser, getMe);
export { authRouter };