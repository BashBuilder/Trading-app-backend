import { Request, Response } from "express";

export const signalController = {
  addSignal: (req: Request, res: Response) => {
    const { name, value } = req.body;
    res.json({
      message: `Signal '${name}' with value '${value}' added successfully!`,
    });
  },
  getSignal: (req: Request, res: Response) => {
    res.json({ message: "Signal route is working!" });
  },
};
