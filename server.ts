import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { timingSafeEqual } from "node:crypto";
import { ServerAuthService } from "./server/authService.js";
import { serverDataStore } from "./server/dataStore.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Security headers without an extra runtime dependency.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // Normal API requests should be small. Files belong in object storage, not JSON bodies.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "256kb" }));

  type RateBucket = { count: number; resetAt: number };
  const rateBuckets = new Map<string, RateBucket>();
  const rateLimit = (name: string, max: number, windowMs: number) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const recipient = String(req.body?.recipient || "").trim().toLowerCase().slice(0, 160);
    const key = `${name}:${ip}:${recipient}`;
    const now = Date.now();
    const current = rateBuckets.get(key);
    if (!current || current.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (current.count >= max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message: "تم تجاوز عدد المحاولات المسموح مؤقتاً. حاول لاحقاً." });
    }
    current.count += 1;
    next();
  };

  const rateLimitIpOnly = (name: string, max: number, windowMs: number) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${name}:${ip}`;
    const now = Date.now();
    const current = rateBuckets.get(key);
    if (!current || current.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (current.count >= max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message: "تم تجاوز عدد المحاولات المسموح من هذا الاتصال مؤقتاً." });
    }
    current.count += 1;
    next();
  };

  const safeEqual = (a: string, b: string) => {
    const aa = Buffer.from(a || "");
    const bb = Buffer.from(b || "");
    return aa.length === bb.length && aa.length > 0 && timingSafeEqual(aa, bb);
  };

  // Legacy maintenance endpoints are server-admin only. Browser roles are never trusted here.
  const requireAdminApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const expected = process.env.ADMIN_API_KEY || "";
    const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const provided = String(req.headers["x-admin-api-key"] || bearer || "");
    if (!expected) return res.status(503).json({ success: false, message: "ADMIN_API_KEY غير مهيأ على الخادم." });
    if (!safeEqual(provided, expected)) return res.status(401).json({ success: false, message: "غير مخول." });
    next();
  };

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

  // Central School Data Synchronization Endpoints (مزامنة البيانات لجميع المستخدمين)
  // SSE: Real-Time Instant Data Stream for all connected users and roles
  app.get("/api/data/events", requireAdminApiKey, (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const current = serverDataStore.getData();
    // Initial handshake
    res.write(
      `data: ${JSON.stringify({
        type: "CONNECTED",
        version: current.version,
        lastModified: current.lastModified,
        lastSyncedBy: current.lastSyncedBy,
      })}\n\n`
    );

    // Heartbeat ping every 20 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(": keep-alive\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    // Subscribe to live database updates (directress additions, deletions, edits)
    const unsubscribe = serverDataStore.subscribe((event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        console.error("SSE push error:", err);
      }
    });

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  // GET: Fetch latest data or check if client has the latest version
  app.get("/api/data/sync", requireAdminApiKey, (req, res) => {
    try {
      const clientVersion = req.query.version ? Number(req.query.version) : null;
      const force = req.query.force === "true";
      const current = serverDataStore.getData();

      if (!force && clientVersion !== null && clientVersion === current.version) {
        return res.json({
          success: true,
          notModified: true,
          version: current.version,
          lastModified: current.lastModified,
          serverTime: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        notModified: false,
        version: current.version,
        lastModified: current.lastModified,
        lastSyncedBy: current.lastSyncedBy,
        data: current.data,
        serverTime: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Data sync GET error:", error);
      return res.status(500).json({
        success: false,
        message: "فشلت مزامنة البيانات من الخادم المركزي.",
      });
    }
  });

  // POST: Push updates from client to server central store
  app.post("/api/data/sync", requireAdminApiKey, (req, res) => {
    try {
      const { updates } = req.body;

      if (!updates || typeof updates !== "object") {
        return res.status(400).json({
          success: false,
          message: "بيانات التحديث غير صالحة.",
        });
      }

      const updated = serverDataStore.updateData(updates, { id: "server-admin", name: "Secure Server Admin", role: "admin" });

      return res.json({
        success: true,
        version: updated.version,
        lastModified: updated.lastModified,
        lastSyncedBy: updated.lastSyncedBy,
        data: updated.data,
        serverTime: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Data sync POST error:", error);
      return res.status(500).json({
        success: false,
        message: "فشل حفظ التحديثات في الخادم المركزي.",
      });
    }
  });

  // GET: Central Data Sync Status & Entity Counts
  app.get("/api/data/status", requireAdminApiKey, (_req, res) => {
    try {
      const status = serverDataStore.getStatus();
      return res.json({
        success: true,
        ...status,
        serverTime: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Data status error:", error);
      return res.status(500).json({
        success: false,
        message: "فشل استرداد حالة المزامنة.",
      });
    }
  });

  // POST: Reset Central Database (with optional seed data)
  app.post("/api/data/reset", requireAdminApiKey, (req, res) => {
    try {
      if (process.env.ALLOW_DATABASE_RESET !== "true" || req.headers["x-reset-confirmation"] !== "RESET-MAYSAN-SCHOOL") {
        return res.status(403).json({ success: false, message: "إعادة ضبط قاعدة البيانات معطلة أمنياً." });
      }
      const { seedData } = req.body;
      const reset = serverDataStore.resetDatabase(seedData);
      return res.json({
        success: true,
        message: "تمت إعادة ضبط قاعدة البيانات المركزية بنجاح.",
        version: reset.version,
        lastModified: reset.lastModified,
      });
    } catch (error: any) {
      console.error("Data reset error:", error);
      return res.status(500).json({
        success: false,
        message: "فشلت إعادة ضبط قاعدة البيانات المركزية.",
      });
    }
  });

  // API Route: Send Real OTP via Email (SMTP) or SMS (Twilio)
  app.post("/api/auth/send-otp", rateLimitIpOnly("otp-send-ip", 20, 15 * 60 * 1000), rateLimit("otp-send-target", 5, 15 * 60 * 1000), async (req, res) => {
    try {
      const { recipient, method, role, accountName } = req.body;

      if (!recipient || !["email", "phone"].includes(method)) {
        return res.status(400).json({
          success: false,
          message: "Recipient and delivery method are required.",
        });
      }

      const result = await ServerAuthService.sendOtp({
        recipient,
        method: method === "phone" ? "phone" : "email",
        role: role || "student",
        accountName: String(accountName || "المستخدم").slice(0, 120),
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
  app.post("/api/auth/verify-otp", rateLimitIpOnly("otp-verify-ip", 40, 15 * 60 * 1000), rateLimit("otp-verify-target", 10, 15 * 60 * 1000), (req, res) => {
    try {
      const { recipient, method, code } = req.body;

      if (!recipient || !code || !["email", "phone"].includes(method)) {
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
