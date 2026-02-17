import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase";
import { generateAccessToken, generateRefreshToken } from "../config/jwt";

const usersCollection = db.collection("users");

export const authController = {
  // ✅ REGISTER
  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }
      // Check if user exists
      const existing = await usersCollection.where("email", "==", email).get();

      if (!existing.empty) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const userRef = await usersCollection.add({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });

      const accessToken = generateAccessToken(userRef.id);
      const refreshToken = generateRefreshToken(userRef.id);

      return res.status(201).json({
        message: "User registered",
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ LOGIN
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const snapshot = await usersCollection.where("email", "==", email).get();

      if (snapshot.empty) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const accessToken = generateAccessToken(userDoc.id);
      const refreshToken = generateRefreshToken(userDoc.id);

      return res.json({ accessToken, refreshToken });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ LOGOUT (client deletes token)
  logout: async (_req: Request, res: Response) => {
    return res.json({ message: "Logged out successfully" });
  },

  // ✅ GET USER (Protected route example)
  getUser: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ message: "No token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string,
      );

      const userDoc = await usersCollection.doc(decoded.userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userData } = userDoc.data() as any;

      return res.json(userData);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  },

  // ✅ REFRESH TOKEN
  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }

      const decoded: any = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string,
      );

      const newAccessToken = generateAccessToken(decoded.userId);

      return res.json({ accessToken: newAccessToken });
    } catch {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  },
};
