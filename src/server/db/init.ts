import "dotenv/config";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as authSchema from "@/server/db/auth-schema";
import * as apiSchema from "@/server/db/schema";

const schema = {
  ...apiSchema,
  ...authSchema,
};

export const db = drizzle(env.thinkordive_db, { schema });
