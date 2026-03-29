import jwt from "jsonwebtoken";
import { BlacklistToken } from "../models/blacklist.model.js";


const authUser = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        });
    }

    // check token is blacklisted or not :
    const isTokenBlacklisted = await BlacklistToken.findOne({
        token
    });

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Token is blacklisted. Please login again."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid token."
        });
    }
}

export { authUser };