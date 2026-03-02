/**
 * Digital FTE API
 * Main Express application
 */

import express from "express";
import cors from "cors";
import {
  contextMiddleware,
  errorLoggingMiddleware,
  authMiddleware,
  optionalAuthMiddleware,
  rateLimitMiddleware,
  planGate,
} from "./middleware";

import { registerAuthRoutes } from "./routes/auth";
import { registerJobRoutes } from "./routes/jobs";
import { registerResumeRoutes } from "./routes/resumes";
import { registerApplicationRoutes } from "./routes/applications";
import { registerChannelRoutes } from "./routes/channels";
import { registerDashboardRoutes } from "./routes/dashboard";

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Correlation-ID"],
  })
);

// Request context (must be first for ID generation)
app.use(contextMiddleware);

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Auth endpoints (no auth required)
const authRouter = express.Router();
registerAuthRoutes(authRouter);
app.use(authRouter);

// Webhook endpoints (no auth required - must be before protected routes)
const webhookRouter = express.Router();
registerChannelRoutes(webhookRouter); // Registers webhooks
app.use(webhookRouter);

// Protected endpoints
const protectedRouter = express.Router();

// Apply middleware to protected routes
protectedRouter.use(authMiddleware); // Verify JWT
protectedRouter.use(rateLimitMiddleware); // Rate limiting

// Register route handlers
registerJobRoutes(protectedRouter);
registerResumeRoutes(protectedRouter);
registerApplicationRoutes(protectedRouter);
registerChannelRoutes(protectedRouter);
registerDashboardRoutes(protectedRouter);

// Mount protected routes
app.use(protectedRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    },
  });
});

// Global error handler (must be last)
app.use(errorLoggingMiddleware);

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default app;
