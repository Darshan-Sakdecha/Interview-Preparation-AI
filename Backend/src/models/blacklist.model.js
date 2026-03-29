import mongoose from "mongoose";

const blackListSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to be added on blacklist"]
    }
}, { timestamps: true });

const BlacklistToken = mongoose.model("BlacklistToken", blackListSchema);

export { BlacklistToken };