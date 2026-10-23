import "dotenv/config"; // must be the first import
import app from "./src/app.js";
import prisma from "./src/config/prisma.js";
import redis from "./src/config/redis.js";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Postgres connected");
} catch (err) {
  console.error("Postgres connection failed:", err);
  process.exit(1);
}

try {
  await redis.ping();
  console.log("Redis connected");
} catch (err) {
  console.error("Redis connection failed:", err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});