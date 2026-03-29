import jwt from "jsonwebtoken";
import { BlacklistToken } from "../models/blacklist.model.js";

const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Token not provided.",
            });
        }

        const isTokenBlacklisted = await BlacklistToken.findOne({ token });

        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "Token is blacklisted. Please login again.",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token.",
        });
    }
};

export { authUser };