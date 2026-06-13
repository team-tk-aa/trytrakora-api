require("dotenv").config();
import express, { Request, Response, NextFunction } from "express";
export const app = express();

// Trust the first proxy (required on Render, Railway, Heroku, etc.)
app.set("trust proxy", 1);
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { ErrorMiddleware } from "./middleware/error";
import adminRouter from "./routes/admin.routes";
import authRouter from "./routes/auth.routes";
import leadRouter from "./routes/lead.routes";
import memberRouter from "./routes/member.routes";
import dashboardRouter from "./routes/dashboard.routes";
import planRouter from "./routes/plan.routes";
import renewalRouter from "./routes/renewal.routes";
import dns from "dns";
import net from "net";

const bodyParser = require("body-parser");

// body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ limit: "50mb" }));

// CORS
const Frontend_URL = process.env.CLIENT_URL as string;
console.log("Frontend URL for CORS:", Frontend_URL);

const corsOptions = {
    origin: [
        Frontend_URL,
        "https://trytrakora.com",
        "https://www.trytrakora.com",
        "https://trytrakora-web.vercel.app",
        "http://localhost:3000",
    ],
    credentials: true, // allow Authorization headers
};
app.use(cors(corsOptions));

// Rate limiting (apply early, before routes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: true,
        message: "API is working",
    });
});

dns.lookup("smtpout.secureserver.net", (err, address) => {
    console.log("DNS Lookup:", err, address);
});

app.get("/smtp-test", (req, res) => {
    const socket = net.createConnection({
        host: "smtpout.secureserver.net",
        port: 587,
        timeout: 10000
    });

    socket.on("connect", () => {
        console.log("CONNECTED TO SMTP PORT 587");
        socket.end();
    });

    socket.on("timeout", () => {
        console.log("SMTP CONNECTION TIMED OUT");
        socket.destroy();
    });

    socket.on("error", (err) => {
        console.log("SMTP CONNECTION ERROR:", err);
    });

    res.send("SMTP test started");
});

// API routes
app.use(
    "/api/v1",
    adminRouter,
    authRouter,
    leadRouter,
    memberRouter,
    dashboardRouter,
    planRouter,
    renewalRouter
);

// Unknown routes
// app.all("/:path(.*)", (req, res, next) => {
//     const error = new Error(`Route ${req.originalUrl} not found`);
//     (error as any).statusCode = 404;
//     next(error);
// });

// Error handler middleware (last)
app.use(ErrorMiddleware);