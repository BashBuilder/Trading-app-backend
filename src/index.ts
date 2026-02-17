import { configDotenv } from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";

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
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
