import { eq } from "drizzle-orm";
import { seed } from "drizzle-seed";
import { auth } from "@/server/auth";
import * as apiSchema from "@/server/db/schema";
import { user } from "./auth-schema";
import { db } from "./init";

// Require name, email, role, and tmppass fields; other fields optional
type BAUser = typeof user.$inferSelect;
type TestUser = Pick<BAUser, "name" | "email" | "role"> &
  Partial<Omit<BAUser, "name" | "email" | "role">> & {
    tmppass: string;
  };

const TEST_USERS = [
  {
    name: "Test Customer",
    email: "customer@thinkordive.local",
    tmppass: "password123",
    role: "customer",
  },
  {
    name: "Test Admin",
    email: "admin@thinkordive.local",
    tmppass: "password123",
    role: "admin",
  },
] as const satisfies TestUser[];

async function upsertUser(u: (typeof TEST_USERS)[number]): Promise<string> {
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, u.email));

  if (existing) {
    console.log(`  ${u.email} already exists, skipping`);
    return existing.id;
  }

  const res = await auth.api.signUpEmail({
    body: { name: u.name, email: u.email, password: u.tmppass },
    headers: new Headers(),
  });

  console.log(`  Created user: ${u.email}`);
  return res.user.id;
}

async function setRole(
  userId: string,
  role: "customer" | "admin",
): Promise<void> {
  await db.update(user).set({ role }).where(eq(user.id, userId));
}

async function main(): Promise<void> {
  console.log("Seeding database...");

  console.log("[1/2] Users");
  const userIds: Record<string, string> = {};
  for (const u of TEST_USERS) {
    const id = await upsertUser(u);
    await setRole(id, u.role);
    userIds[u.role] = id;
  }

  console.log("[2/2] Seeding with drizzle-seed");
  await seed(db, apiSchema);

  console.log("Done seeding database");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
