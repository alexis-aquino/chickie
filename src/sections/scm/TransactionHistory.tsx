import { useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { initials } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  CalendarDays,
  Truck,
  CheckCircle2,
  Clock,
  PhilippinePeso,
  ArrowDownUp,
  FileText,
  TrendingUp,
} from "lucide-react";

type SortKey = "date-desc" | "date-asc" | "total-desc" | "total-asc";
type StatusFilter = "all" | "delivered" | "pending";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export function TransactionHistory() {
  const { purchaseHistory, suppliers, inventory: allItems } = useStore();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const summary = useMemo(() => {
    const total = purchaseHistory.reduce((s, r) => s + r.quantity * r.unitPrice, 0);
    const delivered = purchaseHistory.filter((r) => r.delivered).length;
    const pending = purchaseHistory.filter((r) => !r.delivered).length;
    const suppliersCount = new Set(purchaseHistory.map((r) => r.supplierId)).size;

    const now = new Date();
    const thisMonth = purchaseHistory
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, r) => s + r.quantity * r.unitPrice, 0);

    const lastMonth = purchaseHistory
      .filter((r) => {
        const d = new Date(r.date);
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
      })
      .reduce((s, r) => s + r.quantity * r.unitPrice, 0);

    const mom = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    return { total, delivered, pending, suppliersCount, thisMonth, mom };
  }, [purchaseHistory]);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return purchaseHistory
      .filter((r) => {
        const item = allItems.find((i) => i.id === r.itemId);
        const supplier = suppliers.find((s) => s.id === r.supplierId);
        const matchQ =
          !q || item?.name.toLowerCase().includes(q) || supplier?.name.toLowerCase().includes(q) || r.date.includes(q);
        const matchS = status === "all" || (status === "delivered" && r.delivered) || (status === "pending" && !r.delivered);
        return matchQ && matchS;
      })
      .sort((a, b) => {
        if (sort === "date-desc") return b.date.localeCompare(a.date);
        if (sort === "date-asc") return a.date.localeCompare(b.date);
        const totA = a.quantity * a.unitPrice;
        const totB = b.quantity * b.unitPrice;
        if (sort === "total-desc") return totB - totA;
        return totA - totB;
      });
  }, [purchaseHistory, query, status, sort]);

  const totalPages = Math.ceil(rows.length / PER_PAGE);
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const grandTotal = rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0);

  const handleFilterChange = (cb: () => void) => {
    cb();
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Spend</span>
            <PhilippinePeso className="size-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold tabular-nums">₱{Math.round(summary.total).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{purchaseHistory.length} transactions</div>
        </Card>

        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">This Month</span>
            <TrendingUp className={`size-4 ${summary.mom >= 0 ? "text-destructive" : "text-emerald-600"}`} aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold tabular-nums">₱{Math.round(summary.thisMonth).toLocaleString()}</div>
          <div className={`text-xs font-medium ${summary.mom >= 0 ? "text-destructive" : "text-emerald-600"}`}>
            {summary.mom >= 0 ? "+" : ""}
            {summary.mom.toFixed(1)}% vs last month
          </div>
        </Card>

        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Delivered</span>
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-600">{summary.delivered}</div>
          <div className="text-xs text-muted-foreground">{summary.pending} pending</div>
        </Card>

        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Suppliers Used</span>
            <Truck className="size-4 text-brand" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold tabular-nums">{summary.suppliersCount}</div>
          <div className="text-xs text-muted-foreground">across all orders</div>
        </Card>
      </div>

      <Card className="p-5 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-brand" aria-hidden="true" />
            <div>
              <h3>Transaction History</h3>
              <p className="text-sm text-muted-foreground">
                {rows.length} transaction{rows.length !== 1 ? "s" : ""} · ₱{Math.round(grandTotal).toLocaleString()} total
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search item or supplier…"
                aria-label="Search transactions"
                value={query}
                onChange={(e) => handleFilterChange(() => setQuery(e.target.value))}
                className="pl-8 w-52"
              />
            </div>
            <Select value={status} onValueChange={(v) => handleFilterChange(() => setStatus(v as StatusFilter))}>
              <SelectTrigger className="w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => handleFilterChange(() => setSort(v as SortKey))}>
              <SelectTrigger className="w-40" aria-label="Sort transactions">
                <ArrowDownUp className="size-3.5 mr-1" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="total-desc">Highest total</SelectItem>
                <SelectItem value="total-asc">Lowest total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Transaction ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Supplier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Unit Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Order Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Est. Delivery</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted-foreground py-12">
                      No transactions match your filters.
                    </td>
                  </tr>
                )
                : pageRows.map((rec, idx) => {
                  const item = allItems.find((i) => i.id === rec.itemId);
                  const supplier = suppliers.find((s) => s.id === rec.supplierId);
                  const total = rec.quantity * rec.unitPrice;
                  const txnNum = String((page - 1) * PER_PAGE + idx + 1).padStart(4, "0");

                  return (
                    <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          TXN-{txnNum}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium whitespace-nowrap">{item?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{item?.category}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 shrink-0">
                            <AvatarFallback className="bg-brand text-white text-[10px]">
                              {supplier ? initials(supplier.name) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="whitespace-nowrap text-sm">{supplier?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {rec.quantity} {item?.unit}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">₱{rec.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">₱{total.toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                          {fmtDate(rec.date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Truck className="size-3.5 shrink-0" aria-hidden="true" />
                          {fmtDate(rec.expectedDelivery)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rec.delivered ? (
                          <Badge variant="outline" className="bg-emerald-50 border-emerald-300 text-emerald-700 gap-1 whitespace-nowrap">
                            <CheckCircle2 className="size-3" aria-hidden="true" /> Delivered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 gap-1 whitespace-nowrap">
                            <Clock className="size-3" aria-hidden="true" /> Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>

            {pageRows.length > 0 && (
              <tfoot>
                <tr className="bg-muted/40 border-t">
                  <td colSpan={5} className="px-4 py-3 text-xs text-muted-foreground font-medium">
                    Page total ({pageRows.length} transactions)
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    ₱{pageRows.reduce((s, r) => s + r.quantity * r.unitPrice, 0).toLocaleString()}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {rows.length} results
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p =
                  totalPages <= 5
                    ? i + 1
                    : page <= 3
                    ? i + 1
                    : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className={`w-9 ${p === page ? "bg-brand hover:bg-brand-dark text-white border-brand" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
