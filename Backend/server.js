import "dotenv/config";
import { app } from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const startServer = async () => {
    try {
        await connectDB();

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    } catch (error) {
        console.error("Startup error:", error.message);
        console.error(error);
    }
};

startServer();