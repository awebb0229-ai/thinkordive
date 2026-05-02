import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { stockPrices, stocks } from "@/server/db/schema";
import { db } from "./db/init";

// NOTE: SQLite equivalent of LATERAL JOIN: subquery gets max timestamp per stock,
// then we join stock_prices again on that exact timestamp to get the full row.


export const getStocksWithLatestPrice = createServerFn().handler(async () => {
  const latestPerStock = db
  .select({
    stockId: stockPrices.stockId,
    maxTs: sql`MAX(${stockPrices.timestamp})`.as("max_ts")
  })
  .from(stockPrices)
  .where(eq(stockPrices.interval, "1d"))
  .groupBy(stockPrices.stockId)
  .as("latest_per_stock");

  return db
    .select({ 
      id: stocks.id,
      symbol: stocks.symbol,
      name: stocks.name,
      industry: stocks.industry,
      close: stockPrices.close,
      change: stockPrices.change,
      changePct: stockPrices.changePct,
      volume: stockPrices.volume,
      timestamp: stockPrices.timestamp,
    })
    .from(stocks)
    .leftJoin(latestPerStock, eq(latestPerStock.stockId, stocks.id))
    .leftJoin(
      stockPrices,
      and(
        eq(stockPrices.stockId, stocks.id),
        eq(stockPrices.interval, "1d"),
        eq(stockPrices.timestamp, latestPerStock.maxTs)
      ),
    )
    .orderBy(stocks.symbol);
});

export type RangeKey = "1D" | "1W" | "1M" | "1Y";

export const RANGE_DAYS: Record<RangeKey, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "1Y": 365,
};

// 90-day 1d candles for the chart
export const getStockPriceHistory = createServerFn()
  .inputValidator((input: { stockId: string; range: RangeKey }) => input)
  .handler(async ({ data: { stockId, range } }) => {
    const since = new Date();
    since.setDate(since.getDate() - RANGE_DAYS[range]);

    return db
      .select({
        timestamp: stockPrices.timestamp,
        open: stockPrices.open,
        high: stockPrices.high,
        low: stockPrices.low,
        close: stockPrices.close,
        volume: stockPrices.volume,
      })
      .from(stockPrices)
      .where(
        and(
          eq(stockPrices.stockId, stockId),
          eq(stockPrices.interval, "1d"),
          gte(stockPrices.timestamp, since),
        ),
      )
      .orderBy(stockPrices.timestamp);
  });

const CreateStockSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .regex(/^[A-Z]+$/, "Ticker must be uppercase letters"),
  companyName: z.string().min(1),
  volume: z.coerce.number().int().positive("Volume must be a positive integer"),
  initialPrice: z.coerce
    .number()
    .positive("Initial price must be greater than 0"),
  exchange: z.string().min(1),
  currency: z.string().min(1),
  sector: z.string().optional(),
});

export const createStock = createServerFn({ method: "POST" })
  .inputValidator(CreateStockSchema)
  .handler(async ({ data }) => {
    const [stock] = await db
      .insert(stocks)
      .values({
        id: data.ticker,
        symbol: data.ticker,
        name: data.companyName,
        exchange: data.exchange,
        currency: data.currency,
        sector: data.sector || null,
      })
      .returning();

    await db.insert(stockPrices).values({
      stockId: stock.id,
      interval: "1d",
      timestamp: new Date(),
      open: data.initialPrice,
      high: data.initialPrice,
      low: data.initialPrice,
      close: data.initialPrice,
      volume: data.volume,
    });

    return stock;
  });
