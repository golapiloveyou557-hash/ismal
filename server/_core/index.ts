import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { storagePut } from "../storage";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    if (req.path.startsWith("/api/"))
      res.setHeader("Cache-Control", "no-store");
    next();
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/upload/payment-screenshot", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const { dataUrl, fileName } = req.body as {
        dataUrl?: unknown;
        fileName?: unknown;
      };
      if (typeof dataUrl !== "string" || typeof fileName !== "string") {
        res.status(400).json({ message: "A screenshot file is required." });
        return;
      }

      const match = dataUrl.match(
        /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/
      );
      if (!match) {
        res
          .status(400)
          .json({
            message: "Only PNG, JPEG or WebP screenshots are accepted.",
          });
        return;
      }

      const contentType = match[1];
      const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
      if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
        res
          .status(400)
          .json({ message: "Screenshot must be smaller than 5 MB." });
        return;
      }

      const safeName =
        fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) ||
        "payment-screenshot";
      const uploaded = await storagePut(
        `payment-screenshots/${user.id}/${Date.now()}-${safeName}`,
        buffer,
        contentType
      );
      res.json(uploaded);
    } catch (error) {
      console.warn("[Upload] Payment screenshot upload failed", error);
      res
        .status(401)
        .json({
          message: "You must be signed in to upload a payment screenshot.",
        });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
