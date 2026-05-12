import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";
import { app } from "./app.js";
import { startQuoteRefreshJob } from "./jobs/quote-refresh.job.js";

const server = app.listen(env.PORT, () => {
  console.log(`PawPlan API listening on http://localhost:${env.PORT}`);
});

const quoteRefreshInterval = startQuoteRefreshJob();

const shutdown = async () => {
  clearInterval(quoteRefreshInterval);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
