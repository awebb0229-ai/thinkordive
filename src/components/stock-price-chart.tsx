import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStockPriceHistory,
  RANGE_DAYS,
  type RangeKey,
} from "@/server/stocks";
import { Button } from "./ui/button";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

interface Props {
  stockId: string;
}

export function StockPriceChart({ stockId }: Props) {
  const [range, setRange] = useState<RangeKey>("1M");
  const { data, isLoading } = useQuery({
    queryKey: ["stock-history", stockId, range],
    queryFn: () => getStockPriceHistory({ data: { stockId, range } }),
    staleTime: 60_000, // In ms
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data?.length)
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No price history found.
      </p>
    );

  const chartData = data.map((p) => ({
    date: fmtDate(p.timestamp.toString()),
    close: p.close,
  }));

  const min = Math.min(...chartData.map((d) => d.close));
  const max = Math.max(...chartData.map((d) => d.close));
  const up = chartData[chartData.length - 1].close >= chartData[0].close;
  const color = up ? "#10b981" : "#f87171";

  return (
    <div className="h-48">
      <div className="flex gap-1">
        {Object.keys(RANGE_DAYS).map((r) => (
          <Button
            key={r}
            variant={range === r ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setRange(r as RangeKey)}
          >
            {r}
          </Button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
            className="text-muted-foreground"
          />
          <YAxis
            domain={[min * 0.995, max * 1.005]}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            className="text-muted-foreground"
          />
          <Tooltip
            formatter={(v: number) => [`$${v.toFixed(2)}`, "Close"]}
            contentStyle={{ fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill="url(#grad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
