import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import {databaseURL} from "./config.js";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env(databaseURL),
  },
});