import { useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { initials, formatDate } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, CalendarDays, CheckCircle2, Clock, AlertCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | "pending" | "delivered" | "overdue";

function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function DeliverySchedule() {
  const { purchaseHistory, markDelivered, suppliers, inventory: allItems } = useStore();
  const { user } = useAuth();
  // Owners receive deliveries; supplier accounts confirm the ones they fulfil.
  const canMarkDelivered = user?.role === "owner" || user?.role === "supplier";

  const [filter, setFilter] = useState<Filter>("pending");

  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    return purchaseHistory
      .filter((r) => {
        // "Pending" and "Overdue" are disjoint: overdue orders only appear
        // under their own filter (and in "All Orders").
        if (filter === "pending") return !r.delivered && r.expectedDelivery >= today;
        if (filter === "delivered") return r.delivered;
        if (filter === "overdue") return !r.delivered && r.expectedDelivery < today;
        return true;
      })
      .sort((a, b) => a.expectedDelivery.localeCompare(b.expectedDelivery));
  }, [purchaseHistory, filter, today]);

  const counts = useMemo(() => {
    const pending = purchaseHistory.filter((r) => !r.delivered && r.expectedDelivery >= today).length;
    const overdue = purchaseHistory.filter((r) => !r.delivered && r.expectedDelivery < today).length;
    const delivered = purchaseHistory.filter((r) => r.delivered).length;
    return { pending, overdue, delivered, total: purchaseHistory.length };
  }, [purchaseHistory, today]);

  const handleMark = (id: string, itemName: string) => {
    markDelivered(id);
    toast.success(`${itemName} marked as delivered`, {
      description: "On-hand inventory has been updated.",
      icon: <PackageCheck className="size-4" />,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className="p-4 gap-1 cursor-pointer hover:shadow-md transition-shadow border-amber-200 bg-amber-50/50"
          onClick={() => setFilter("pending")}
        >
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <Clock className="size-3.5" aria-hidden="true" /> Pending
          </div>
          <div className="text-2xl font-medium tabular-nums text-amber-700">{counts.pending}</div>
        </Card>
        <Card
          className="p-4 gap-1 cursor-pointer hover:shadow-md transition-shadow border-destructive/20 bg-destructive/5"
          onClick={() => setFilter("overdue")}
        >
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
            <AlertCircle className="size-3.5" aria-hidden="true" /> Overdue
          </div>
          <div className="text-2xl font-medium tabular-nums text-destructive">{counts.overdue}</div>
        </Card>
        <Card
          className="p-4 gap-1 cursor-pointer hover:shadow-md transition-shadow border-emerald-200 bg-emerald-50/50"
          onClick={() => setFilter("delivered")}
        >
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> Delivered
          </div>
          <div className="text-2xl font-medium tabular-nums text-emerald-700">{counts.delivered}</div>
        </Card>
        <Card className="p-4 gap-1 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("all")}>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Truck className="size-3.5" aria-hidden="true" /> All Orders
          </div>
          <div className="text-2xl font-medium tabular-nums">{counts.total}</div>
        </Card>
      </div>

      <Card className="p-5 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2">
              <Truck className="size-4 text-brand" aria-hidden="true" />
              Delivery Schedule
            </h3>
            <p className="text-sm text-muted-foreground">Track expected arrival dates for all ordered items</p>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-40" aria-label="Filter deliveries">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="all">All Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? (
          <div className="text-center text-muted-foreground py-14">
            <Truck className="size-10 mx-auto mb-3 text-muted-foreground/40" aria-hidden="true" />
            <p className="text-sm">No deliveries in this view.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((rec) => {
              const item = allItems.find((i) => i.id === rec.itemId);
              const supplier = suppliers.find((s) => s.id === rec.supplierId);
              const days = daysUntil(rec.expectedDelivery);
              const overdue = !rec.delivered && rec.expectedDelivery < today;
              const isToday = !rec.delivered && rec.expectedDelivery === today;

              let statusColor = "border-amber-200 bg-amber-50/40";
              let badgeEl = (
                <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 gap-1">
                  <Clock className="size-3" aria-hidden="true" />
                  {days === 0 ? "Today" : `In ${days}d`}
                </Badge>
              );

              if (rec.delivered) {
                statusColor = "border-emerald-200 bg-emerald-50/30";
                badgeEl = (
                  <Badge variant="outline" className="bg-emerald-50 border-emerald-300 text-emerald-700 gap-1">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Delivered
                  </Badge>
                );
              } else if (overdue) {
                statusColor = "border-destructive/25 bg-destructive/5";
                badgeEl = (
                  <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive gap-1">
                    <AlertCircle className="size-3" aria-hidden="true" />
                    Overdue {Math.abs(days)}d
                  </Badge>
                );
              } else if (isToday) {
                statusColor = "border-blue-200 bg-blue-50/40";
                badgeEl = (
                  <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 gap-1">
                    <Truck className="size-3" aria-hidden="true" />
                    Today
                  </Badge>
                );
              }

              return (
                <div
                  key={rec.id}
                  className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${statusColor}`}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-brand text-white text-sm">
                      {supplier ? initials(supplier.name) : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item?.name ?? "Unknown item"}</span>
                      {badgeEl}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{supplier?.name ?? "Unknown supplier"}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>
                        {rec.quantity} {item?.unit}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>₱{(rec.quantity * rec.unitPrice).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-0.5 text-sm shrink-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      <span className="text-xs">Ordered {formatDate(rec.date)}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-medium ${overdue ? "text-destructive" : "text-foreground"}`}>
                      <Truck className="size-3.5" aria-hidden="true" />
                      <span className="text-xs">Expected {formatDate(rec.expectedDelivery)}</span>
                    </div>
                  </div>

                  {canMarkDelivered && !rec.delivered && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleMark(rec.id, item?.name ?? "Item")}
                    >
                      <PackageCheck className="size-3.5" aria-hidden="true" />
                      Mark Delivered
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
