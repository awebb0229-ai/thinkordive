/** biome-ignore-all lint/style/noNonNullAssertion: Guarentee that Cloudflare-related env is setup properly */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

function getLocalD1DB() {
  try {
    const basePath = path.resolve(".wrangler");
    const dbFile = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .find((f) => f.endsWith(".sqlite"));

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}`);
    }

    const url = path.resolve(basePath, dbFile);
    return url;
  } catch (err) {
    console.log(`Error  ${err}`);
  }
}

// NOTE: This is only used locally by the CLI
export default defineConfig({
  out: "./drizzle",
  schema: ["./src/server/db/schema.ts", "./src/server/db/auth-schema.ts"],
  dialect: "sqlite",
  ...(process.env.NODE_ENV === "production"
    ? {
        driver: "d1-http",
        dbCredentials: {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
          databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
          token: process.env.CLOUDFLARE_D1_TOKEN!,
        },
      }
    : {
        dbCredentials: {
          url: getLocalD1DB(),
        },
      }),
});
