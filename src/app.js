import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import userRoute from "./routes/user.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Global error handler (must be registered after routes)
app.use(errorHandler);

// /users is prefix
app.use("/users", userRoute);

export default app;
