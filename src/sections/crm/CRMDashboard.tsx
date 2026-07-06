import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { TIER_CONFIG } from "@/lib/crm-data";
import { totalSpent, avgRating } from "@/utils/crm";
import { initials } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Stars } from "@/components/Stars";
import { Users, Star, TrendingUp, PhilippinePeso, Zap, AlertTriangle, ArrowRight, Crown } from "lucide-react";

export function CRMDashboard() {
  const { customers, promotions, inventory } = useStore();

  const stats = useMemo(() => {
    const total = customers.length;
    const repeat = customers.filter((c) => c.orders.length > 1).length;
    const repeatPct = total ? Math.round((repeat / total) * 100) : 0;
    const allOrders = customers.flatMap((c) => c.orders.filter((o) => o.status === "Completed"));
    const revenue = allOrders.reduce((s, o) => s + o.total, 0);
    const avgOrder = allOrders.length ? Math.round(revenue / allOrders.length) : 0;
    const allFeedback = customers.flatMap((c) => c.feedback);
    const avgSatisfaction = allFeedback.length
      ? (allFeedback.reduce((s, f) => s + f.rating, 0) / allFeedback.length).toFixed(1)
      : "—";

    const topSpenders = [...customers].sort((a, b) => totalSpent(b) - totalSpent(a)).slice(0, 5);

    return { total, repeat, repeatPct, revenue, avgOrder, avgSatisfaction, topSpenders };
  }, [customers]);

  const activePromos = promotions.filter((p) => p.status === "Active");

  // SCM-triggered alert: items that are Low stock and have an active promo
  const scmAlerts = activePromos
    .map((promo) => {
      const item = inventory.find((i) => i.id === promo.linkedInventoryItemId);
      return { promo, item };
    })
    .filter((x) => x.item);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Customers</span>
            <Users className="size-4 text-brand" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{stats.repeat} repeat customers</div>
        </Card>

        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Repeat Rate</span>
            <TrendingUp className="size-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600">{stats.repeatPct}%</div>
          <div className="text-xs text-muted-foreground">customers with 2+ orders</div>
        </Card>

        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Revenue</span>
            <PhilippinePeso className="size-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold tabular-nums">₱{stats.revenue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">avg ₱{stats.avgOrder} / order</div>
        </Card>

        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg Satisfaction</span>
            <Star className="size-4 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold">{stats.avgSatisfaction}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Stars rating={parseFloat(String(stats.avgSatisfaction)) || 0} size="xs" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5 gap-4">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-yellow-500" aria-hidden="true" />
            <h3>Top Spenders</h3>
          </div>
          <div className="flex flex-col gap-3">
            {stats.topSpenders.map((c, idx) => {
              const spent = totalSpent(c);
              const rating = avgRating(c);
              const tierCfg = TIER_CONFIG[c.tier];
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className={`${tierCfg.bg} ${tierCfg.color} text-sm font-medium`}>
                      {initials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{c.name}</span>
                      <Badge variant="outline" className={`text-xs shrink-0 ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border}`}>
                        {c.tier}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {c.orders.length} orders
                      {rating !== null && (
                        <>
                          · <Stars rating={rating} size="xs" />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-right shrink-0">₱{spent.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-brand" aria-hidden="true" />
            <h3>SCM-Triggered Promotions</h3>
            <Badge className="ml-auto bg-red-100 text-red-700 border-red-200">{activePromos.length} active</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {scmAlerts.map(({ promo, item }) => {
              const pct = item ? Math.round((item.quantity / item.par) * 100) : 0;
              return (
                <div key={promo.id} className="rounded-xl border p-3 flex flex-col gap-2 bg-amber-50/50 border-amber-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                      <span className="text-sm font-medium">{promo.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700 shrink-0">
                      {promo.discount}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{promo.reason}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Stock: <span className="font-medium text-amber-700">{pct}% of par</span>
                      {" · "}
                      {promo.targetCustomerIds.length} targets
                    </span>
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      Expires {new Date(promo.expiresOn).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5 gap-4">
        <h3>Loyalty Tier Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {(["Bronze", "Silver", "Gold"] as const).map((tier) => {
            const count = customers.filter((c) => c.tier === tier).length;
            const pct = customers.length ? Math.round((count / customers.length) * 100) : 0;
            const cfg = TIER_CONFIG[tier];
            return (
              <div key={tier} className={`rounded-xl border p-4 flex flex-col gap-2 ${cfg.bg} ${cfg.border}`}>
                <div className={`text-sm font-semibold ${cfg.color}`}>{tier}</div>
                <div className={`text-3xl font-semibold tabular-nums ${cfg.color}`}>{count}</div>
                <div className="text-xs text-muted-foreground">{pct}% of customers</div>
                <div className="w-full bg-white/60 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-current opacity-50" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
