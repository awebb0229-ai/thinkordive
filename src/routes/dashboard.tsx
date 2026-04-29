import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/auth/auth-client";
import { AppSidebar } from "@/components/app-sidebar";
import { StockPriceChart } from "@/components/stock-price-chart";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { authMiddleware } from "@/middleware/auth";
import { getStocksWithLatestPrice } from "@/server/stocks";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { deleteStock } from "@/server/stocks";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  loader: () => getStocksWithLatestPrice(),
  server: {
    middleware: [authMiddleware],
  },
});

const fmtVol = (v: number | null) => {
  if (v == null) return "—";
  return v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : `${(v / 1_000).toFixed(0)}K`;
};

function RouteComponent() {
  // Stock logic
  const stocks = Route.useLoaderData();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedStock = stocks.find((s) => s.id === selected);

  // Auth and session logic
  const { data: sessionData, isPending } = authClient.useSession();
  if (isPending) {
    return <div className="p-8">Loading...</div>;
  }

  if (!sessionData) {
    return <div className="p-8">Session Data is null</div>;
  }

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
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>Hello "/dashboard"!</div>
            <Button>
              <Link to="/stocks/create">Add stock</Link>
            </Button>
          </div>
          {selectedStock ? `${selectedStock.symbol}` : "Select a stock"}
          {selected ? (
            <StockPriceChart stockId={selected} />
          ) : (
            <p>Click on any row to view its price chart.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((s) => {
                const up = (s.changePct ?? 0) >= 0;
                const isSelected = s.id === selected;
                return (
                  <TableRow
                    key={s.id}
                    onClick={() => setSelected(isSelected ? null : s.id)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected && "bg-muted",
                    )}
                  >
                    <TableCell className="font-mono font-semibold">
                      {s.symbol}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate">
                      {s.name}
                    </TableCell>
                    <TableCell>
                      {s.sector && (
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {s.sector}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${s.close}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        up ? "text-emerald-500" : "text-red-500",
                      )}
                    >
                      {up ? "+" : ""}
                      {s.changePct}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {fmtVol(s.volume)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}