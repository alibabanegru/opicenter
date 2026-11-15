import path from "path";
import app from "./api/index";

const portArgIdx = process.argv.indexOf("--port");
const cliPort = portArgIdx !== -1 ? Number(process.argv[portArgIdx + 1]) : NaN;
const PORT = Number.isFinite(cliPort) && cliPort > 0 ? cliPort : Number(process.env.PORT) || 3000;

async function startServer() {
  // Vite middleware for development (initialize without blocking port binding)
  if (process.env.NODE_ENV !== "production") {
    const vitePromise = import("vite").then(({ createServer }) =>
      createServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: "spa",
      })
    );
    vitePromise.catch((err) => {
      console.error("Failed to initialize Vite dev server:", err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const express = (await import("express")).default;
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
