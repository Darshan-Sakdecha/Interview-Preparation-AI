import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "username already taken"],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Account already exists with this email address"]
    },
    password :{
        type:String,
        required:true

    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export { User };