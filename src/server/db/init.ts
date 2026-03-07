import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/env";
import * as authSchema from "@/server/db/auth-schema";
import * as apiSchema from "@/server/db/schema";

const schema = {
  ...apiSchema,
  ...authSchema,
};

export const db = drizzle(env.DATABASE_URL, { schema });
