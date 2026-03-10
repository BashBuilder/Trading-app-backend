import { Router } from "express";

const signalRoutes = Router();

signalRoutes.get("/signal", (req, res) => {
  res.json({ message: "Signal route is working!" });
});

export default signalRoutes;
