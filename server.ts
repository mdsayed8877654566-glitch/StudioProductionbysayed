import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { 
  getStoreDb, 
  getStoreVersion, 
  syncStoreDb, 
  updateStoreEntity, 
  deleteStoreEntity, 
  getBackupsList, 
  restoreBackupFile, 
  resetStoreDbToDefaults 
} from "./server/storeDb";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // STORE PERSISTENCE API (Multi-Device & Live Online Sync)
  app.get("/api/store", (req, res) => {
    try {
      const db = getStoreDb();
      res.json({ success: true, data: db, version: db.version, lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch store database" });
    }
  });

  app.get("/api/store/version", (req, res) => {
    try {
      const ver = getStoreVersion();
      res.json({ success: true, version: ver.version, lastUpdated: ver.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/store/sync", (req, res) => {
    try {
      const updated = syncStoreDb(req.body);
      res.json({ success: true, data: updated, version: updated.version, lastUpdated: updated.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to sync store database" });
    }
  });

  app.post("/api/store/entity/:type", (req, res) => {
    try {
      const updated = updateStoreEntity(req.params.type, req.body);
      res.json({ success: true, data: updated, version: updated.version, lastUpdated: updated.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to update entity" });
    }
  });

  app.delete("/api/store/entity/:type/:id", (req, res) => {
    try {
      const updated = deleteStoreEntity(req.params.type, req.params.id);
      res.json({ success: true, data: updated, version: updated.version, lastUpdated: updated.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to delete entity" });
    }
  });

  app.get("/api/store/backups", (req, res) => {
    try {
      const backups = getBackupsList();
      res.json({ success: true, data: backups });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/store/restore", (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ success: false, error: "Filename is required" });
      }
      const restored = restoreBackupFile(filename);
      if (!restored) {
        return res.status(404).json({ success: false, error: "Backup file not found or corrupted" });
      }
      res.json({ success: true, data: restored });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/store/reset", (req, res) => {
    try {
      const reset = resetStoreDbToDefaults();
      res.json({ success: true, data: reset });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/notify-order", async (req, res) => {
    try {
      const { orderNumber, customerName, customerEmail, total, paymentMethod } = req.body;
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // To admin
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      
      if (!adminEmail || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials not fully configured. Notification not sent.");
        return res.json({ success: false, message: "SMTP not configured" });
      }

      await transporter.sendMail({
        from: `"Store Notifications" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `New Order Placed: #${orderNumber}`,
        text: `A customer has placed an order.\n\nOrder Number: ${orderNumber}\nCustomer: ${customerName} (${customerEmail})\nTotal: ${total}\nPayment Method: ${paymentMethod}\n\nPlease check the admin panel for more details.`,
        html: `<p>A customer has placed an order.</p><ul><li><strong>Order Number:</strong> ${orderNumber}</li><li><strong>Customer:</strong> ${customerName} (${customerEmail})</li><li><strong>Total:</strong> ${total}</li><li><strong>Payment Method:</strong> ${paymentMethod}</li></ul><p>Please check the admin panel for more details.</p>`,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  app.post("/api/notify-approval", async (req, res) => {
    try {
      const { orderNumber, customerName, customerEmail } = req.body;
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials not fully configured. Notification not sent.");
        return res.json({ success: false, message: "SMTP not configured" });
      }

      await transporter.sendMail({
        from: `"Store Notifications" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Your Order #${orderNumber} has been Approved!`,
        text: `Hi ${customerName},\n\nGood news! Your order #${orderNumber} has been approved and is now being processed.\n\nThank you for shopping with us!`,
        html: `<p>Hi ${customerName},</p><p>Good news! Your order <strong>#${orderNumber}</strong> has been approved and is now being processed.</p><p>Thank you for shopping with us!</p>`,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
