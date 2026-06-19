import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/shared/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgres://user:password@localhost:5432/speed_dating",
  },
  strict: true,
  verbose: true,
});
