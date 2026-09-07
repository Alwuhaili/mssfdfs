import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { ServerAuthService } from "./server/authService.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check & SMTP / Twilio configuration status
  app.get("/api/health", (_req, res) => {
    const hasSmtpPass = Boolean(process.env.SMTP_PASS);
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      smtpConfigured: hasSmtpPass || Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      smsConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER),
    });
  });

  // API Route: Send Real OTP via Email (SMTP) or SMS (Twilio)
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { recipient, method, role, accountName, customCode } = req.body;

      if (!recipient || !method) {
        return res.status(400).json({
          success: false,
          message: "Recipient and delivery method are required.",
        });
      }

      const result = await ServerAuthService.sendOtp({
        recipient,
        method: method === "phone" ? "phone" : "email",
        role: role || "student",
        accountName: accountName || "المستخدم",
        customCode,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Send OTP endpoint error:", error);
      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء إرسال كود التحقق. يرجى المحاولة لاحقاً.",
      });
    }
  });

  // API Route: Verify OTP Code
  app.post("/api/auth/verify-otp", (req, res) => {
    try {
      const { recipient, method, code } = req.body;

      if (!recipient || !code) {
        return res.status(400).json({
          success: false,
          message: "Recipient and code are required.",
        });
      }

      const result = ServerAuthService.verifyOtp({
        recipient,
        method: method === "phone" ? "phone" : "email",
        code,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error: any) {
      console.error("Verify OTP endpoint error:", error);
      return res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء التحقق من الرمز.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
        watch: isHmrDisabled ? null : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
