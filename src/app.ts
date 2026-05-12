import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { prisma } from "./db/prisma.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { apiRouter, apiV1Router } from "./routes/index.js";
import { getStorageReadiness } from "./modules/uploads/upload.service.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "pawplan"
  });
});

app.get("/ready", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const storage = await getStorageReadiness();

    res.json({
      status: storage.ready ? "ready" : "degraded",
      service: "pawplan",
      checks: {
        database: "ok",
        storage
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1", apiV1Router);
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
