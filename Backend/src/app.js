import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";

const app = express();
const isDev = process.env.NODE_ENV !== "production";

const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(cookieParser());

// Dev request log: METHOD /url status time
if (isDev) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`
      );
    });
    next();
  });
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler: must be last
app.use((err, req, res, next) => {
  const status = err.statusCode ?? err.status ?? 500;

  // Full error in the terminal: always for 5xx, and for everything in dev
  if (status >= 500 || isDev) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const expose = err.name === "AuthError" || status < 500;

  res.status(status).json({
    message: expose || isDev ? err.message : "Internal server error",
    ...(isDev && status >= 500 && { stack: err.stack }),
  });
});

export default app;