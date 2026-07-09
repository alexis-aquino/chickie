import { useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { stockStatus, supplierName } from "@/utils/inventory";
import type { Category, InventoryItem, PaymentMethod, StockStatus } from "@/types/inventory";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItemDialog } from "./InventoryItemDialog";
import { PaymentDialog } from "./PaymentDialog";
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  PhilippinePeso,
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: (Category | "All")[] = [
  "All",
  "Meats & Proteins",
  "Carbohydrates & Sides",
  "Dairy & Produce",
  "Sauces, Dips & Seasonings",
  "Beverages",
  "Kitchen Essentials",
];

const CATEGORY_COLORS: Record<Category, string> = {
  "Meats & Proteins": "bg-red-100 text-red-700 border-red-200",
  "Carbohydrates & Sides": "bg-amber-100 text-amber-700 border-amber-200",
  "Dairy & Produce": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Sauces, Dips & Seasonings": "bg-orange-100 text-orange-700 border-orange-200",
  Beverages: "bg-blue-100 text-blue-700 border-blue-200",
  "Kitchen Essentials": "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_STYLES: Record<StockStatus, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  Low: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Healthy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const PROGRESS_COLOR: Record<StockStatus, string> = {
  Critical: "[&>div]:bg-destructive",
  Low: "[&>div]:bg-amber-500",
  Healthy: "[&>div]:bg-emerald-500",
};

type StatusFilter = "All" | StockStatus;

export function InventoryTable() {
  const { inventory, suppliers, deleteInventoryItem, submitOrder } = useStore();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [reorderItem, setReorderItem] = useState<InventoryItem | null>(null);

  // One-click reorder tops the item back up to its PAR level.
  const reorderQty = (item: InventoryItem) => Math.max(Math.round((item.par - item.quantity) * 100) / 100, 1);

  const handleReorderPaid = async (method: PaymentMethod) => {
    if (!reorderItem) return;
    const qty = reorderQty(reorderItem);
    const today = new Date().toISOString().slice(0, 10);
    const expected = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    await submitOrder([
      {
        itemId: reorderItem.id,
        supplierId: reorderItem.supplierId,
        date: today,
        expectedDelivery: expected,
        quantity: qty,
        unitPrice: reorderItem.unitCost,
        paymentMethod: method,
      },
    ]);
    toast.success(`Reorder placed for ${reorderItem.name}`, {
      description: `${qty} ${reorderItem.unit} via ${method} · arriving ${new Date(expected).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    });
    setReorderItem(null);
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };
  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Delete "${item.name}"? This also removes its purchase history. This can't be undone.`)) {
      return;
    }
    const error = await deleteInventoryItem(item.id);
    if (error) toast.error(error);
    else toast.success(`${item.name} removed from inventory.`);
  };

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [statusF, setStatusF] = useState<StatusFilter>("All");

  const summary = useMemo(() => {
    const critical = inventory.filter((i) => stockStatus(i) === "Critical").length;
    const low = inventory.filter((i) => stockStatus(i) === "Low").length;
    const healthy = inventory.filter((i) => stockStatus(i) === "Healthy").length;
    const value = inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    return { critical, low, healthy, total: inventory.length, value };
  }, [inventory]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return inventory.filter((item) => {
      const matchQ = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchC = category === "All" || item.category === category;
      const matchS = statusF === "All" || stockStatus(item) === statusF;
      return matchQ && matchC && matchS;
    });
  }, [inventory, query, category, statusF]);

  const grouped = useMemo(() => {
    if (category !== "All") return null;
    const map = new Map<Category, typeof filtered>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered, category]);

  const rows = grouped
    ? Array.from(grouped.entries()).flatMap(([cat, items]) => [
        { type: "group" as const, cat },
        ...items.map((i) => ({ type: "row" as const, item: i })),
      ])
    : filtered.map((i) => ({ type: "row" as const, item: i }));

  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Items</span>
            <Package className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold">{summary.total}</div>
          <div className="text-xs text-muted-foreground">{CATEGORIES.length - 1} categories</div>
        </Card>

        <Card className="p-4 gap-1.5 border-destructive/30 bg-destructive/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-destructive font-medium">Critical</span>
            <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-destructive">{summary.critical}</div>
          <div className="text-xs text-muted-foreground">needs reorder now</div>
        </Card>

        <Card className="p-4 gap-1.5 border-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-medium">Running Low</span>
            <TrendingDown className="size-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-amber-700">{summary.low}</div>
          <div className="text-xs text-muted-foreground">below 50% of par</div>
        </Card>

        {isOwner ? (
          <Card className="p-4 gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Stock Value</span>
              <PhilippinePeso className="size-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="text-2xl font-semibold tabular-nums">₱{Math.round(summary.value).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{summary.healthy} items healthy</div>
          </Card>
        ) : (
          <Card className="p-4 gap-1.5 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-medium">Healthy</span>
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="text-2xl font-semibold text-emerald-700">{summary.healthy}</div>
            <div className="text-xs text-muted-foreground">well stocked</div>
          </Card>
        )}
      </div>

      <Card className="p-5 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3>Inventory on Hand</h3>
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {summary.total} items · stock vs par
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search items…"
                aria-label="Search inventory items"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-full sm:w-48"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as Category | "All")}>
              <SelectTrigger className="w-44" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusF} onValueChange={(v) => setStatusF(v as StatusFilter)}>
              <SelectTrigger className="w-32" aria-label="Filter by stock status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Healthy">Healthy</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-brand hover:bg-brand-dark text-white gap-1.5" onClick={openAddDialog}>
              <Plus className="size-4" aria-hidden="true" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-52">Stock Level</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">On Hand</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Par</th>
                {isOwner && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Unit Cost</th>}
                {isOwner && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Value</th>}
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={isOwner ? 9 : 7} className="text-center text-muted-foreground py-12">
                    {inventory.length === 0
                      ? "No inventory yet — click \"Add Item\" to log your first ingredient."
                      : "No items match your filters."}
                  </td>
                </tr>
              )}

              {rows.map((entry) => {
                if (entry.type === "group") {
                  return (
                    <tr key={`group-${entry.cat}`} className="bg-muted/30">
                      <td colSpan={isOwner ? 9 : 7} className="px-4 py-2">
                        <Badge variant="outline" className={`text-xs font-semibold ${CATEGORY_COLORS[entry.cat]}`}>
                          {entry.cat}
                        </Badge>
                      </td>
                    </tr>
                  );
                }

                const { item } = entry;
                const status = stockStatus(item);
                const pct = Math.min(100, Math.round((item.quantity / item.par) * 100));
                const value = item.quantity * item.unitCost;

                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      {category === "All" ? null : <div className="text-xs text-muted-foreground">{item.category}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[160px]">
                      <span className="truncate block">{supplierName(suppliers, item.supplierId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Progress value={pct} className={`h-2 ${PROGRESS_COLOR[status]}`} />
                      <div className="text-xs text-muted-foreground mt-1">{pct}%</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {item.quantity} <span className="text-muted-foreground font-normal">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {item.par} {item.unit}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        ₱{item.unitCost.toLocaleString()}/{item.unit}
                      </td>
                    )}
                    {isOwner && (
                      <td className="px-4 py-3 text-right tabular-nums font-medium">₱{Math.round(value).toLocaleString()}</td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={STATUS_STYLES[status]}>
                        {status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isOwner && status === "Critical" && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 bg-brand hover:bg-brand-dark text-white text-xs px-2"
                            onClick={() => setReorderItem(item)}
                            aria-label={`Reorder ${item.name}`}
                          >
                            <ShoppingCart className="size-3" aria-hidden="true" />
                            Reorder
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(item)}
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <InventoryItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editingItem} />

      {reorderItem && (
        <PaymentDialog
          open
          onOpenChange={(v) => !v && setReorderItem(null)}
          total={reorderQty(reorderItem) * reorderItem.unitCost}
          summary={`Reorder ${reorderItem.name} · ${reorderQty(reorderItem)} ${reorderItem.unit} (top up to PAR ${reorderItem.par})`}
          onConfirm={handleReorderPaid}
        />
      )}
    </div>
  );
}
