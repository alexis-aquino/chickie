import { useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import type { Category } from "@/types/inventory";
import { initials } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, TrendingUp, TrendingDown, Minus, CalendarDays } from "lucide-react";

const categories: (Category | "All")[] = [
  "All",
  "Meats & Proteins",
  "Carbohydrates & Sides",
  "Dairy & Produce",
  "Sauces, Dips & Seasonings",
  "Beverages",
  "Kitchen Essentials",
];

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PriceTrend({ prices }: { prices: number[] }) {
  if (prices.length < 2) return <Minus className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  const diff = prices[0] - prices[1];
  if (diff > 0) return <TrendingUp className="size-3.5 text-destructive" aria-hidden="true" />;
  if (diff < 0) return <TrendingDown className="size-3.5 text-emerald-500" aria-hidden="true" />;
  return <Minus className="size-3.5 text-muted-foreground" aria-hidden="true" />;
}

export function PurchaseHistory() {
  const { inventory, purchaseHistory, suppliers } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");

  const itemPurchases = useMemo(() => {
    const map = new Map<string, typeof purchaseHistory>();
    for (const rec of purchaseHistory) {
      const existing = map.get(rec.itemId) ?? [];
      map.set(rec.itemId, [...existing, rec]);
    }
    for (const [key, records] of map) {
      map.set(key, records.sort((a, b) => b.date.localeCompare(a.date)));
    }
    return map;
  }, [purchaseHistory]);

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [inventory, query, category]);

  const totalSpend = useMemo(() => {
    return purchaseHistory.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);
  }, [purchaseHistory]);

  const totalOrders = purchaseHistory.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: totalOrders },
          { label: "Total Spend", value: `₱${Math.round(totalSpend).toLocaleString()}` },
          { label: "Items Tracked", value: inventory.length },
          { label: "Active Suppliers", value: suppliers.filter((s) => s.status === "Active").length },
        ].map((s) => (
          <Card key={s.label} className="p-4 gap-1">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-xl font-medium tabular-nums">{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3>Purchase History</h3>
            <p className="text-sm text-muted-foreground">Suppliers, unit prices, and order dates per item</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search items…"
                aria-label="Search purchase history items"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-full sm:w-52"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as Category | "All")}>
              <SelectTrigger className="w-40" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Accordion type="multiple" className="flex flex-col gap-2">
          {filteredItems.map((item) => {
            const records = itemPurchases.get(item.id) ?? [];
            const prices = records.map((r) => r.unitPrice);
            const latestRecord = records[0];
            const totalItemSpend = records.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);
            const uniqueSupplierIds = [...new Set(records.map((r) => r.supplierId))];

            return (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border rounded-xl px-4 data-[state=open]:border-brand/30 data-[state=open]:bg-red-50/30 transition-colors"
              >
                <AccordionTrigger className="py-3.5 hover:no-underline">
                  <div className="flex items-center gap-4 w-full pr-4">
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    </div>

                    <div className="hidden sm:flex -space-x-2">
                      {uniqueSupplierIds.map((sid) => {
                        const sup = suppliers.find((s) => s.id === sid);
                        if (!sup) return null;
                        return (
                          <Avatar key={sid} className="size-7 ring-2 ring-background">
                            <AvatarFallback className="bg-brand text-white text-xs">{initials(sup.name)}</AvatarFallback>
                          </Avatar>
                        );
                      })}
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="flex items-center justify-end gap-1">
                        <PriceTrend prices={prices} />
                        <span className="font-medium text-sm">
                          ₱{latestRecord?.unitPrice.toFixed(2) ?? "—"}/{item.unit}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {records.length} order{records.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2 pb-1">
                      {uniqueSupplierIds.map((sid) => {
                        const sup = suppliers.find((s) => s.id === sid);
                        if (!sup) return null;
                        return (
                          <Badge key={sid} variant="outline" className="gap-1.5 py-1">
                            <span className="size-2 rounded-full bg-brand-light inline-block" aria-hidden="true" />
                            {sup.name}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Supplier</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Qty</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Unit Price</th>
                            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((rec, idx) => {
                            const sup = suppliers.find((s) => s.id === rec.supplierId);
                            const prevPrice = records[idx + 1]?.unitPrice;
                            const priceChange = prevPrice !== undefined ? rec.unitPrice - prevPrice : null;
                            return (
                              <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                                    {fmt(rec.date)}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="size-6">
                                      <AvatarFallback className="bg-brand text-white text-xs">
                                        {sup ? initials(sup.name) : "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[160px]">{sup?.name ?? "Unknown"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                  {rec.quantity} {item.unit}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {priceChange !== null && (
                                      <span
                                        className={`text-xs ${
                                          priceChange > 0 ? "text-destructive" : priceChange < 0 ? "text-emerald-500" : "text-muted-foreground"
                                        }`}
                                      >
                                        {priceChange > 0 ? "+" : ""}₱{Math.abs(priceChange).toFixed(2)}
                                      </span>
                                    )}
                                    <span className="font-medium">₱{rec.unitPrice.toFixed(2)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums font-medium">
                                  ₱{(rec.quantity * rec.unitPrice).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/40 border-t">
                            <td colSpan={4} className="px-4 py-2.5 text-xs text-muted-foreground">
                              Total spend on {item.name}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-sm">
                              ₱{Math.round(totalItemSpend).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center text-muted-foreground py-12">No items match your filters.</div>
          )}
        </Accordion>
      </Card>
    </div>
  );
}
