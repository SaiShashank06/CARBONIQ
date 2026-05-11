require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const config = require("./config");
const rateLimiter = require("./middleware/rateLimiter");
const { sanitizeBody } = require("./middleware/validator");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const emissionRoutes = require("./routes/emissions");
const aiRoutes = require("./routes/ai");
const reportRoutes = require("./routes/reports");
const referenceRoutes = require("./routes/reference");

const app = express();
const PORT = config.server.port;

app.use(
  helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
);
app.use(cors(config.cors));
app.use(morgan(config.server.isDev ? "dev" : "combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", rateLimiter);
app.use("/api", sanitizeBody);
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/emissions", emissionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reference", referenceRoutes);
app.get("/", (req, res) => {
  res.json({ status: "Backend running successfully" });
});

app.get("/api/health", (req, res) => {
  const hasDeepSeek = !!config.ai.deepseekApiKey;
  const hasAnthropic = !!config.ai.anthropicApiKey;
  const aiPrimary = hasDeepSeek
    ? "deepseek"
    : hasAnthropic
      ? "anthropic"
      : null;

  res.json({
    status: "OK",
    service: config.app.name,
    version: config.app.version,
    ai: {
      available: !!(hasDeepSeek || hasAnthropic),
      primary: aiPrimary,
      deepseek: { available: hasDeepSeek, model: config.ai.deepseekModel },
      anthropic: { available: hasAnthropic, model: config.ai.anthropicModel },
    },
    uptime: Math.round(process.uptime()) + "s",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/*", notFoundHandler);
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/index.html")),
);
app.use(errorHandler);

app.listen(PORT, () => {
  const hasDeepSeek = !!config.ai.deepseekApiKey;
  const hasAnthropic = !!config.ai.anthropicApiKey;

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║    🌿 CoalCarbon IQ — Carbon Intelligence v2     ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`   URL      : http://localhost:${PORT}`);
  console.log(`   Health   : http://localhost:${PORT}/api/health`);
  console.log(
    `   DeepSeek : ${hasDeepSeek ? "✅ Configured (primary)" : "⚠️  Not set"}`,
  );
  console.log(
    `   Anthropic: ${hasAnthropic ? "✅ Configured (fallback)" : "—  Not set"}`,
  );
  console.log("══════════════════════════════════════════════════\n");
});

module.exports = app;
