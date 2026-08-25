import { configDotenv } from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoute from "./routes/auth.route";
import subscriptionRoute from "./routes/subscription.route";
import signalRoute from "./routes/signal.route";
import tierRoute from "./routes/tier.route";
import adminSubscriptionRouter from "./routes/admin.subscription";

configDotenv();
const app = express();
const version = "/api/v1";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Comma-separated list of allowed web origins, e.g. "https://app.elitescope.com,https://admin.elitescope.com"
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (native apps, curl, server-to-server) — allow.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(helmet());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use(`${version}/auth`, authRoute);
app.use(`${version}/subscriptions`, subscriptionRoute);
app.use(`${version}/signals`, signalRoute);
app.use(`${version}/tiers`, tierRoute);
app.use(`${version}/admin/subscriptions`, adminSubscriptionRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
