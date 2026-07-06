import { useState, useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { TIER_CONFIG } from "@/lib/crm-data";
import type { LoyaltyTier } from "@/types/crm";
import { totalSpent, avgRating } from "@/utils/crm";
import { initials, formatDate } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Stars } from "@/components/Stars";
import { Search, ShoppingBag, Phone, Mail, Calendar, ChevronRight, Award, MessageSquare, Package } from "lucide-react";

type TierFilter = LoyaltyTier | "All";

export function CustomerList() {
  const { customers } = useStore();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>("All");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return customers.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) &&
        (tier === "All" || c.tier === tier),
    );
  }, [customers, query, tier]);

  const customer = customers.find((c) => c.id === selected) ?? null;

  return (
    <>
      <Card className="p-5 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3>Customer Profiles</h3>
            <p className="text-sm text-muted-foreground">{filtered.length} customers</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search name or email…"
                aria-label="Search customers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-52"
              />
            </div>
            <Select value={tier} onValueChange={(v) => setTier(v as TierFilter)}>
              <SelectTrigger className="w-32" aria-label="Filter by tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Contact</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Tier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Points</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Orders</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total Spent</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Rating</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground py-12">
                    {customers.length === 0
                      ? "No customers yet. They'll show up here once you start logging orders."
                      : "No customers match your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const spent = totalSpent(c);
                const rating = avgRating(c);
                const cfg = TIER_CONFIG[c.tier];
                return (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setSelected(c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback className={`${cfg.bg} ${cfg.color} text-sm font-medium`}>
                            {initials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground flex gap-1 flex-wrap">
                            {c.tags.map((t) => (
                              <span key={t} className="bg-muted rounded px-1">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="text-xs">{c.email}</div>
                      <div className="text-xs">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {c.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{c.loyaltyPoints.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.orders.length}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">₱{spent.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {rating !== null ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Stars rating={rating} size="xs" />
                          <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground block text-center">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="size-7" aria-label={`View ${c.name}`}>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {customer &&
            (() => {
              const cfg = TIER_CONFIG[customer.tier];
              const spent = totalSpent(customer);
              const nextTier = customer.tier === "Bronze" ? "Silver" : customer.tier === "Silver" ? "Gold" : null;
              const nextThreshold = nextTier ? TIER_CONFIG[nextTier].min : null;
              const ptsToNext = nextThreshold ? nextThreshold - customer.loyaltyPoints : 0;
              return (
                <>
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarFallback className={`${cfg.bg} ${cfg.color} text-lg font-semibold`}>
                          {initials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          {customer.name}
                          <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-xs`}>
                            {customer.tier}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground font-normal">{customer.email}</div>
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-5 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Phone, label: "Phone", val: customer.phone },
                        { icon: Mail, label: "Email", val: customer.email },
                        { icon: Calendar, label: "Member since", val: formatDate(customer.joinDate, "month-year") },
                        { icon: ShoppingBag, label: "Total orders", val: String(customer.orders.length) },
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="flex items-start gap-2 text-sm">
                          <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className="font-medium">{val}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="size-4 text-yellow-500" aria-hidden="true" />
                        <span className="font-medium">Loyalty Points</span>
                        <span className="ml-auto text-xl font-semibold tabular-nums">
                          {customer.loyaltyPoints.toLocaleString()} pts
                        </span>
                      </div>
                      {nextTier && (
                        <div className="text-xs text-muted-foreground mb-1.5">
                          {ptsToNext} pts to <span className={TIER_CONFIG[nextTier].color}>{nextTier}</span>
                        </div>
                      )}
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-brand-light to-brand-accent-light"
                          style={{ width: `${Math.min(100, (customer.loyaltyPoints / (nextThreshold ?? customer.loyaltyPoints)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="size-4 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">Favorite Items</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {customer.favoriteItems.map((item) => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag className="size-4 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">Order History</span>
                        <span className="ml-auto text-sm font-semibold text-brand">₱{spent.toLocaleString()} total</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {customer.orders.map((order) => (
                          <div key={order.id} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-muted-foreground">{formatDate(order.date, "long")}</span>
                              <span className="font-semibold">₱{order.total.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {customer.feedback.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
                            <span className="font-medium">Feedback</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {customer.feedback.map((fb) => (
                              <div key={fb.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <Stars rating={fb.rating} size="xs" />
                                  <span className="text-xs text-muted-foreground">{formatDate(fb.date)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground italic">&quot;{fb.comment}&quot;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
        </SheetContent>
      </Sheet>
    </>
  );
}
