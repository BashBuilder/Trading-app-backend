import { Router, Request, Response } from "express";
import { emailService, getResendClient } from "../services/email.service";

import * as dotenv from "dotenv";

dotenv.config();

const webhookRoutes: Router = Router();

webhookRoutes.post("/resend", async (req: Request, res: Response) => {
  try {
    res.status(200).json({ received: true });

    const resend = getResendClient();
    if (!resend) {
      throw new Error("RESEND_API_KEY not set");
    }

    const event = req.body;
    const email = event.data;
    const { data } = await resend.emails.receiving.get(email.email_id);

    await emailService.forwardContactEmail(
      email.from,
      process.env.CONTACT_EMAIL as string,
      data?.subject || "",
      data?.text || "",
    );
  } catch (error) {
    throw error;
  }
});

export default webhookRoutes;
