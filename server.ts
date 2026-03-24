import { app } from "./app";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "./utils/db";
require("dotenv").config();
import http from "http";
import "./jobs/renewalReminder.job";

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Create HTTP server 
const server = http.createServer(app);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is connected to port ${PORT}`);
    connectDB();
});
