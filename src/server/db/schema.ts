import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const stocks = sqliteTable("stocks", {
  id: text("id").primaryKey(), // e.g. "AAPL" — symbol as PK keeps joins readable
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  sector: text("sector"), // e.g. "Technology"
  exchange: text('exchange').notNull(),
  currency: text('currency').notNull(),
  industry: text("industry"), // e.g. "Consumer Electronics"
  logoUrl: text("logo_url"), // handy for dashboard cards
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

const PRICE_INTERVALS = ["1m", "5m", "15m", "30m", "1h", "1d", "1w"] as const;
export type PriceInterval = (typeof PRICE_INTERVALS)[number];

export const stockPrices = sqliteTable(
  "stock_prices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    stockId: text("stock_id")
      .notNull()
      .references(() => stocks.id, { onDelete: "cascade" }),
    interval: text("interval", { enum: PRICE_INTERVALS }).notNull(),
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
    // OHLCV - stored as real (64-bit float)
    open: real("open").notNull(),
    high: real("high").notNull(),
    low: real("low").notNull(),
    close: real("close").notNull(),
    volume: integer("volume").notNull(),
    change: real("change"),
    changePct: real("change_pct"),
  },
  (t) => [
    index("stock_prices_stock_interval_ts_idx").on(
      t.stockId,
      t.interval,
      t.timestamp,
    ),
    uniqueIndex("stock_prices_unique_candle_idx").on(
      t.stockId,
      t.interval,
      t.timestamp,
    ),
  ],
);

// Types
export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;
export type StockPrice = typeof stockPrices.$inferSelect;
export type NewStockPrice = typeof stockPrices.$inferInsert;
