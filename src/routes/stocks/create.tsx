import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
import { cn } from "@/lib/utils";
import { adminMiddleware } from "@/middleware/auth";
import { createStock } from "@/server/stocks";

export const Route = createFileRoute("/stocks/create")({
  component: RouteComponent,
  server: {
    middleware: [adminMiddleware],
  },
});

const EXCHANGES = [{ value: "NYSE", label: "NYSE", sub: "New York" }];
const CURRENCIES = ["USD"];

interface StockForm {
  companyName: string;
  ticker: string;
  volume: string;
  initialPrice: string;
  exchange: string;
  currency: string;
  sector: string;
}

type ChecklistKey =
  | "ticker"
  | "companyName"
  | "volume"
  | "initialPrice"
  | "exchange"
  | "currency";

const CHECKLIST_FIELDS: [ChecklistKey, string][] = [
  ["ticker", "Ticker symbol"],
  ["companyName", "Company name"],
  ["volume", "Volume of shares"],
  ["initialPrice", "Initial price"],
  ["exchange", "Exchange"],
  ["currency", "Currency"],
];

const defaultForm: StockForm = {
  companyName: "",
  ticker: "",
  volume: "",
  initialPrice: "",
  exchange: "NYSE",
  currency: "USD",
  sector: "",
};

const CreateStockSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .max(5, "Ticker must be 5 characters or fewer")
    .regex(/^[A-Z]+$/, "Ticker must be uppercase letters only"),
  companyName: z.string().min(1, "Company name is required"),
  volume: z.coerce
    .number({ error: "Volume must be a number" })
    .int("Volume must be a whole number")
    .positive("Volume must be greater than 0"),
  initialPrice: z.coerce
    .number({ error: "Initial price must be a number" })
    .positive("Initial price must be greater than 0"),
  exchange: z.string().min(1, "Exchange is required"),
  currency: z.string().min(1, "Currency is required"),
  sector: z.string().optional(),
});

type FormErrors = Partial<Record<keyof StockForm, string>>;

const fmtPrice = (n: string, currency: string) => {
  if (!n) return "—";
  const num = parseFloat(n);
  if (Number.isNaN(num)) return "—";
  return `${currency} ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

function RouteComponent() {
  const navigate = useNavigate();
  const [form, setForm] = useState<StockForm>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set =
    (key: keyof StockForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      // Clear the error for this field as the user types
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const checks = {
    ticker: form.ticker.length > 0,
    companyName: form.companyName.length > 0,
    exchange: form.exchange.length > 0,
    currency: form.currency.length > 0,
    volume: form.volume.length > 0,
    initialPrice: form.initialPrice.length > 0,
  };

  const completedCount = Object.values(checks).filter(Boolean).length;
  const allDone = completedCount === Object.keys(checks).length;

  const handleSubmit = async () => {
    // Run client-side Zod validation first
    const result = CreateStockSchema.safeParse({
      ticker: form.ticker,
      companyName: form.companyName,
      exchange: form.exchange,
      currency: form.currency,
      volume: form.volume,
      initialPrice: form.initialPrice,
      sector: form.sector,
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof StockForm;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await createStock({ data: result.data });
      toast.success("Stock listed successfully");
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to list stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticker">Ticker symbol</Label>
              <Input
                id="ticker"
                value={form.ticker}
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    ticker: e.target.value.toUpperCase(),
                  }));
                  if (errors.ticker)
                    setErrors((p) => ({ ...p, ticker: undefined }));
                }}
                placeholder="e.g. AAPL"
                maxLength={5}
                className={cn(
                  "font-mono font-semibold tracking-widest uppercase",
                  errors.ticker &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.ticker && (
                <p className="text-xs text-destructive">{errors.ticker}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={set("companyName")}
                placeholder="e.g. Apple Inc."
                className={cn(
                  errors.companyName &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName}</p>
              )}
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
                className={cn(
                  errors.volume &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.volume && (
                <p className="text-xs text-destructive">{errors.volume}</p>
              )}
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
                className={cn(
                  errors.initialPrice &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.initialPrice && (
                <p className="text-xs text-destructive">
                  {errors.initialPrice}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-5 flex flex-col gap-3">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              Exchange
            </p>
            <div className="grid grid-cols-3 gap-2">
              {EXCHANGES.map(({ value, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, exchange: value }))}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-center transition-colors",
                    form.exchange === value
                      ? "border-slate-600 bg-slate-50 dark:bg-slate-950/30"
                      : "border-border hover:border-muted-foreground/40",
                  )}
                >
                  <span
                    className={cn(
                      "block text-xs font-semibold",
                      form.exchange === value
                        ? "text-slate-800 dark:text-slate-300"
                        : "text-foreground",
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      "block text-[10px] mt-0.5",
                      form.exchange === value
                        ? "text-slate-600 dark:text-slate-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

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
              <SelectTrigger id="currency" className="w-40">
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
              className="flex-1 bg-slate-700 hover:bg-slate-800 text-white"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Listing…" : "List stock →"}
            </Button>
          </div>
        </div>

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
              ["Initial price", fmtPrice(form.initialPrice, form.currency)],
              ["Currency", form.currency],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-center py-1.5 border-b last:border-0 text-sm"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant="secondary"
                className={cn(
                  allDone &&
                    "bg-slate-100 text-slate-800 dark:slate-950 dark:text-slate-300",
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
              {CHECKLIST_FIELDS.map(([key, label]) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-colors",
                    checks[key] ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                      checks[key] ? "bg-slate-600" : "bg-muted-foreground/30",
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
  );
}
