import { Request, Response } from "express";

export const authController = {
  login: async (req: Request, res: Response) => {},
  register: async (req: Request, res: Response) => {},
  logout: async (req: Request, res: Response) => {},
  refresh: async (req: Request, res: Response) => {},
  verify: async (req: Request, res: Response) => {},
  forgotPassword: async (req: Request, res: Response) => {},
  resetPassword: async (req: Request, res: Response) => {},
  verifyOtp: async (req: Request, res: Response) => {},
  resendOtp: async (req: Request, res: Response) => {},
  getOtp: async (req: Request, res: Response) => {},
  getUser: async (req: Request, res: Response) => {},
  refreshToken: async (req: Request, res: Response) => {},
};
