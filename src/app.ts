import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import bodyParser from "body-parser";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";

const app: Application = express();

export const corsOptions = {
  origin: [
    "https://trobits.com",
    "https://www.trobits.com",
    "https://admin.trobits.com",
    // "https://sisiku-frontend.vercel.app",
    // "https://sisiku-dashboard-client.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "*",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware setup

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Route handler for the root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "welcome to Sisiku Project API.",
  });
});

// app.use("/uploads", express.static(path.join("/var/www/uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve static files from the "uploads" directory

// Setup API routes
app.use("/api/v1", router);

// Error handling middleware
app.use(GlobalErrorHandler);

// 404 Not Found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
 console.log(`API NOT FOUND: ${req.originalUrl}`);
});

export default app;
