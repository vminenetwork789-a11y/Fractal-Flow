import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoints for Cloud Run container deployment checks
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/healthz", (_req, res) => {
    res.status(200).send("OK");
  });

  // Resolve dist or build path depending on where server is run
  const distPath = fs.existsSync(path.join(__dirname, "dist", "index.html"))
    ? path.join(__dirname, "dist")
    : fs.existsSync(path.join(__dirname, "build", "index.html"))
    ? path.join(__dirname, "build")
    : fs.existsSync(path.join(__dirname, "dist"))
    ? path.join(__dirname, "dist")
    : __dirname;
  const indexHtmlInDist = path.join(distPath, "index.html");
  const hasBuiltDist = fs.existsSync(indexHtmlInDist);

  if (hasBuiltDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(indexHtmlInDist);
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${hasBuiltDist ? "production" : "development"} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
