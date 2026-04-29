import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
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

type StockForm = {
  companyName: string;
  ticker: string;
  volume: string;
  initialPrice: string;
  exchange: string;
  currency: string;
  sector: string;
};

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
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));

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
    <SidebarProvider>
      <AppSidebar variant="inset" />

      <SidebarInset>
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">

          <div className="rounded-xl border bg-card p-6 flex flex-col gap-6">

            {/* Ticker */}
            <div className="flex flex-col gap-1.5">
              <Label>Ticker symbol</Label>
              <Input
                value={form.ticker}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    ticker: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono uppercase"
              />
            </div>

            {/* Company */}
            <div className="flex flex-col gap-1.5">
              <Label>Company name</Label>
              <Input value={form.companyName} onChange={set("companyName")} />
            </div>

            {/* Volume */}
            <div className="flex flex-col gap-1.5">
              <Label>Volume</Label>
              <Input type="number" value={form.volume} onChange={set("volume")} />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <Label>Initial price</Label>
              <Input
                type="number"
                value={form.initialPrice}
                onChange={set("initialPrice")}
              />
            </div>

            {/* Sector */}
            <div className="flex flex-col gap-3">
              <Label>Sector</Label>
              <Select
                value={form.sector}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    sector: v ?? "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
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

            {/* Exchange */}
            <div className="flex flex-col gap-3">
              <Label>Exchange</Label>

              {EXCHANGES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      exchange: value,
                    }))
                  }
                  className={cn(
                    "border rounded-md p-2",
                    form.exchange === value && "bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Currency */}
            <div className="flex flex-col gap-3">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    sector: v ?? "",
                  }))
                }
                
              >
                <SelectTrigger>
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

            {/* Submit */}
            <Button disabled={!allDone || isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Creating..." : "Create stock"}
            </Button>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}