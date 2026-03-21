import { configDotenv } from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoute from "./routes/auth.route";
import subscriptionRoute from "./routes/subscription.route";
import signalRoute from "./routes/signal.route";
import tierRoute from "./routes/tier.route";

configDotenv();
const app = express();
const version = "/api/v1";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["*", "http://localhost:3000", "http://localhost:3001"],
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

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
