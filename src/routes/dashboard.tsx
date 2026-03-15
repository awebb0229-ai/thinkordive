import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { StockPriceChart } from "@/components/stock-price-chart";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { authMiddleware } from "@/middleware/auth";
import { getStocksWithLatestPrice } from "@/server/stocks";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  loader: () => getStocksWithLatestPrice(),
  server: {
    middleware: [authMiddleware],
  },
});

const fmt = (v: string | null, decimals = 2) =>
  v == null
    ? "—"
    : parseFloat(v).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
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
  const [open, setOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const depositInputRef = useRef<HTMLInputElement>(null);
  const withdrawInputRef = useRef<HTMLInputElement>(null);
  const selectedStock = stocks.find((s) => s.id === selected);

  // Auth and session logic
  const { data: sessionData, isPending } = authClient.useSession();

  // Load balance on mount
  useEffect(() => {
    if (!sessionData?.user?.id) return;
    
    const loadBalance = async () => {
      try {
        // First, try to load from localStorage for immediate UI update
        const storedBalance = localStorage.getItem(`balance_${sessionData.user.id}`);
        if (storedBalance) {
          setBalance(parseFloat(storedBalance));
        }
        
        // Then fetch from server to get authoritative balance
        const response = await fetch(`/api/user/balance`);
        if (response.ok) {
          const data = await response.json();
          const serverBalance = data.balance ?? 0;
          setBalance(serverBalance);
          localStorage.setItem(`balance_${sessionData.user.id}`, serverBalance.toString());
        }
      } catch (error) {
        console.error("Failed to load balance:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadBalance();
  }, [sessionData?.user?.id]);

  // Save balance when it changes
  useEffect(() => {
    if (!sessionData?.user?.id || isLoadingBalance) return;
    
    const saveBalance = async () => {
      try {
        // Save to localStorage immediately
        localStorage.setItem(`balance_${sessionData.user.id}`, balance.toString());
        
        // Also save to server
        await fetch(`/api/user/balance`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance }),
        });
      } catch (error) {
        console.error("Failed to save balance:", error);
      }
    };

    saveBalance();
  }, [balance, sessionData?.user?.id, isLoadingBalance]);

  const handleOpenChange = (newOpenState: boolean) => {
    if (!newOpenState) {
      console.log("Dialog is closing, updating variable...");
    }
    setOpen(newOpenState);
  }

  const handleDeposit = () => {
    const amount = depositInputRef.current?.value;
    if (amount && parseFloat(amount) > 0) {
      setBalance(balance + parseFloat(amount));
      if (depositInputRef.current) {
        depositInputRef.current.value = "";
      }
      setOpen(false);
    }
  }

  const handleWithdraw = () => {
    const amount = withdrawInputRef.current?.value;
    if (amount && parseFloat(amount) > 0 && parseFloat(amount) <= balance) {
      setBalance(balance - parseFloat(amount));
      if (withdrawInputRef.current) {
        withdrawInputRef.current.value = "";
      }
      setWithdrawOpen(false);
    }
  }

  // Auth and session logic
  if (isPending) {
    return <div className="p-8">Loading...</div>;
  }

  if (!sessionData) {
    return <div className="p-8">Session Data is null</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">

      <h1 className = "text-4xl font-bold text-white text-center">
        {sessionData?.user?.name ? `${sessionData.user.name}'s Profile` : "Profile"}
      </h1>

      <h2 className = "text-2xl font-semibold text-white text-center gap-4 mt-6">
        Current balance: ${balance.toFixed(2)}
      </h2>

      <div className = "flex flex-col items-center gap-4 mt-6">

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="px-10 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-100">
            Deposit Cash
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How much cash do you want to deposit?</DialogTitle>
            <DialogDescription>
              <Input id="deposit-cash" type="number" ref={depositInputRef}></Input>
            </DialogDescription>
          </DialogHeader>
            <button onClick={handleDeposit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Ok</button>
        </DialogContent>
      </Dialog>


      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogTrigger asChild>
          <button className="px-10 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-100">
            Withdraw Cash
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How much cash do you want to withdraw?</DialogTitle>
            <DialogDescription>
              <Input id="withdraw-cash" type="number" ref={withdrawInputRef}></Input>
            </DialogDescription>
          </DialogHeader>
          <button onClick={handleWithdraw} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Ok</button>
        </DialogContent>
      </Dialog>
    </div>
      <div>Hello "/dashboard"!</div>
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
            const up = parseFloat(s.change_pct ?? "0") >= 0;
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
                    <Badge variant="secondary" className="text-xs font-normal">
                      {s.sector}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${fmt(s.close)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums",
                    up ? "text-emerald-500" : "text-red-500",
                  )}
                >
                  {up ? "+" : ""}
                  {fmt(s.change_pct)}%
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
  );
}
