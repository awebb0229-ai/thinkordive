import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { authMiddleware } from "@/middleware/auth";
import { createStock } from "@/server/stocks";

export const Route = createFileRoute("/stocks/create")({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
});

const EXCHANGES = [{ value: "NYSE", label: "NYSE", sub: "New York" }];
const CURRENCIES = ["USD"];
const SECTORS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Energy",
  "Consumer Discretionary",
  "Communication Services",
  "Industrials",
];

interface StockForm {
  companyName: string;
  ticker: string;
  volume: string;
  initialPrice: string;
  exchange: string;
  currency: string;
  sector: string;
}

const defaultForm: StockForm = {
  companyName: "",
  ticker: "",
  volume: "",
  initialPrice: "",
  exchange: "NYSE",
  currency: "USD",
  sector: "",
};

const fmtPrice = (n: string, currency: string) => {
  if (!n) return "—";
  const num = parseFloat(n);
  if (isNaN(num)) return "—";
  return `${currency} ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

function RouteComponent() {
  const navigate = useNavigate();
  const [form, setForm] = useState<StockForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set =
    (key: keyof StockForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const checks = {
    ticker: form.ticker.length > 0,
    companyName: form.companyName.length > 0,
    exchange: form.exchange.length > 0,
    currency: form.currency.length > 0,
    volume: form.volume.length > 0,
    initialPrice: form.initialPrice.length > 0,
    sector: form.sector.length > 0,
  };

  const completedCount = Object.values(checks).filter(Boolean).length;
  const allDone = completedCount === Object.keys(checks).length;

  const handleSubmit = async () => {
    if (!allDone) return;
    setIsSubmitting(true);
    try {
      await createStock({
        data: {
          ticker: form.ticker,
          companyName: form.companyName,
          exchange: form.exchange,
          currency: form.currency,
          volume: parseInt(form.volume, 10),
          initialPrice: parseFloat(form.initialPrice),
          sector: form.sector,
        },
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
          <p className="text-sm text-muted-foreground">
            Instruments &rsaquo;{" "}
            <span className="text-foreground">New listing</span>
          </p>

          <div className="grid grid-cols-[1fr_300px] gap-5 items-start">
            <div className="rounded-xl border bg-card p-6 flex flex-col gap-6">
              <div className="border-b pb-5">
                <h1 className="text-2xl font-light tracking-tight">
                  New stock listing
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a new instrument to the tradeable universe
                </p>
              </div>

              {/* Identity Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ticker">Ticker symbol</Label>
                  <Input
                    id="ticker"
                    value={form.ticker}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        ticker: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. AAPL"
                    maxLength={5}
                    className="font-mono font-semibold tracking-widest uppercase"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={set("companyName")}
                    placeholder="e.g. Apple Inc."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    type="number"
                    value={form.volume}
                    onChange={set("volume")}
                    placeholder="e.g. 1000000"
                    min="0"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="initialPrice">Initial price</Label>
                  <Input
                    id="initialPrice"
                    type="number"
                    value={form.initialPrice}
                    onChange={set("initialPrice")}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Sector Section */}
              <div className="border-t pt-5 flex flex-col gap-3">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Sector
                </p>
                <Select
                  value={form.sector}
                  onValueChange={(v) => setForm((p) => ({ ...p, sector: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select industry sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exchange Section */}
              <div className="border-t pt-5 flex flex-col gap-3">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Exchange
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {EXCHANGES.map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, exchange: value }))
                      }
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-center transition-colors",
                        form.exchange === value
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                          : "border-border hover:border-muted-foreground/40",
                      )}
                    >
                      <span
                        className={cn(
                          "block text-xs font-semibold",
                          form.exchange === value
                            ? "text-emerald-800 dark:text-emerald-300"
                            : "text-foreground",
                        )}
                      >
                        {label}
                      </span>
                      <span
                        className={cn(
                          "block text-[10px] mt-0.5",
                          form.exchange === value
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Section */}
              <div className="border-t pt-5 flex flex-col gap-3">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Currency
                </p>
                <Select
                  value={form.currency}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, currency: v ?? "" }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-5 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                  disabled={!allDone || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Listing…" : "List stock →"}
                </Button>
              </div>
            </div>

            {/* Sidebar Preview */}
            <div className="flex flex-col gap-4 sticky top-6">
              <div className="rounded-xl border bg-card p-4 flex flex-col gap-0">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                  Live preview
                </p>
                <p className="font-mono text-3xl font-semibold tracking-wider">
                  {form.ticker || "—"}
                </p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {form.companyName || "Company name"}
                </p>
                {[
                  ["Exchange", form.exchange],
                  ["Sector", form.sector || "—"],
                  ["Initial price", fmtPrice(form.initialPrice, form.currency)],
                  ["Currency", form.currency],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center py-1.5 border-b last:border-0 text-sm"
                  >
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right ml-2">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      allDone &&
                        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                    )}
                  >
                    {allDone ? "Ready to list" : "Draft"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                  Checklist ({completedCount}/{Object.keys(checks).length})
                </p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      ["ticker", "Ticker symbol"],
                      ["companyName", "Company name"],
                      ["sector", "Industry sector"],
                      ["volume", "Volume of shares"],
                      ["initialPrice", "Initial price"],
                      ["exchange", "Exchange"],
                      ["currency", "Currency"],
                    ] as [keyof typeof checks, string][]
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-colors",
                        checks[key] ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                          checks[key] ? "bg-emerald-600" : "bg-muted-foreground/30"
                        )}
                      />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}