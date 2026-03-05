import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { user } from "./auth-schema";
import { db } from "./init";
import { cashAccount, marketSetting, stock, stockPriceHistory } from "./schema";

const TEST_USERS = [
  {
    name: "Test Customer",
    email: "customer@thinkordive.local",
    password: "password123",
    username: "testcustomer",
    role: "customer" as const,
  },
  {
    name: "Test Admin",
    email: "admin@thinkordive.local",
    password: "password123",
    username: "testadmin",
    role: "admin" as const,
  },
] as const;

const SAMPLE_STOCKS = [
  {
    ticker: "AAPL",
    companyName: "Apple Inc.",
    volume: 1_000_000,
    price: 200.0,
  },
  {
    ticker: "MSFT",
    companyName: "Microsoft Corp.",
    volume: 1_000_000,
    price: 200.0,
  },
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corp.",
    volume: 10_000_000,
    price: 500.0,
  },
] as const;

const MARKET_SETTINGS = [
  {
    key: "market_hours",
    value: {
      openTime: "09:30",
      closeTime: "16:00",
      timezone: "America/New_York",
    },
  },
  {
    key: "market_schedule",
    value: {
      tradingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
  },
] as const;

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
    body: { name: u.name, email: u.email, password: u.password },
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

async function upsertCashAccount(userId: string): Promise<void> {
  // $10k starting balance for dev
  await db
    .insert(cashAccount)
    .values({ userId, balance: "10000.00" })
    .onConflictDoNothing();
}

async function seedMarketSettings(): Promise<void> {
  for (const s of MARKET_SETTINGS) {
    await db
      .insert(marketSetting)
      .values({ settingKey: s.key, settingValue: s.value })
      .onConflictDoUpdate({
        target: marketSetting.settingKey,
        set: { settingValue: s.value },
      });
    console.log(`  Market setting: ${s.key}`);
  }
}

async function seedStocks(adminId: string): Promise<void> {
  for (const s of SAMPLE_STOCKS) {
    const price = String(s.price);
    const [existing] = await db
      .select({ id: stock.id })
      .from(stock)
      .where(eq(stock.ticker, s.ticker));

    if (existing) {
      console.log(`  ${s.ticker} already exists, skipping`);
      continue;
    }

    const [created] = await db
      .insert(stock)
      .values({
        ticker: s.ticker,
        companyName: s.companyName,
        totalVolume: s.volume,
        availableVolume: s.volume,
        initialPrice: price,
        currentPrice: price,
        openingPrice: price,
        dayHigh: price,
        dayLow: price,
        previousClose: price,
        createdBy: adminId,
      })
      .returning({ id: stock.id });

    // Seed initial price history point
    await db.insert(stockPriceHistory).values({
      stockId: created.id,
      price,
    });

    console.log(`  ✓  Stock: ${s.ticker} @ $${s.price}`);
  }
}

async function seed(): Promise<void> {
  console.log("Seeding database...");

  console.log("[1/4] Users");
  const userIds: Record<string, string> = {};
  for (const u of TEST_USERS) {
    const id = await upsertUser(u);
    await setRole(id, u.role);
    userIds[u.role] = id;
  }

  console.log("[2/4] Cash accounts");
  for (const id of Object.values(userIds)) {
    await upsertCashAccount(id);
    console.log(`  Cash account for user ${id.slice(0, 8)}…`);
  }

  console.log("[3/4] Market settings");
  await seedMarketSettings();

  console.log("[4/4] Stocks");
  await seedStocks(userIds.admin);

  console.log("Done seeding database\n");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
