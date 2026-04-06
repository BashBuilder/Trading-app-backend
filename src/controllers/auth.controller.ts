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
      const { firstName, lastName, email, password } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }
      // Check if user exists
      const existing = await usersCollection.where("email", "==", email).get();

      if (!existing.empty) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const userRef = await usersCollection.add({
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        createdAt: new Date(),
      });

      const userData = {
        id: userRef.id,
        firstName,
        lastName,
        email,
      };

      // const accessToken = generateAccessToken(userRef.id);
      // const refreshToken = generateRefreshToken(userRef.id);

      return res.status(201).json({
        message: "User registered",
        success: true,
        // user: userData,
        // accessToken: accessToken || "no token generated",
        // refreshToken: refreshToken || "no token generated",
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ LOGIN
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const emailNormalized = email.trim().toLowerCase();

      const snapshot = await usersCollection
        .where("email", "==", emailNormalized)
        .get();

      if (snapshot.empty) {
        return res.status(400).json({ message: "User not found" });
      }

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const accessToken = generateAccessToken(userDoc.id);
      const refreshToken = generateRefreshToken(userDoc.id);
      console.log();
      return res.json({ user: userDoc.data(), accessToken, refreshToken });
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
      return res.json(req.user);
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

  getWebhook: async (req: Request, res: Response) => {
    console.log("Webhook query", req.query);
    console.log("Webhook hit with body:", req.body);
    return res.json({ message: "Webhook received" });
  },

  getAllUsers: async (_req: Request, res: Response) => {
    try {
      const snapshot = await usersCollection.get();
      const users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },
};
