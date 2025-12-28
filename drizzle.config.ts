import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  schema: path.join(__dirname, "src/lib/database/instance.ts"),
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:data/payments.db",
  },
});
