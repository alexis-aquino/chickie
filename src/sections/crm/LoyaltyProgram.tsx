import { useStore } from "@/hooks/use-store";
import { TIER_CONFIG } from "@/lib/crm-data";
import type { LoyaltyTier } from "@/types/crm";
import { totalSpent } from "@/utils/crm";
import { initials } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, Gift, Star, Zap } from "lucide-react";

const TIER_BENEFITS: Record<LoyaltyTier, string[]> = {
  Bronze: ["1 pt per ₱10 spent", "Birthday treat", "Early promo access"],
  Silver: ["1.5 pts per ₱10 spent", "Free upsize on combo", "Monthly exclusive deal", "Priority support"],
  Gold: [
    "2 pts per ₱10 spent",
    "Free item on every 5th order",
    "VIP-only promos",
    "Dedicated account manager",
    "Free delivery on large orders",
  ],
};

const TIER_ICONS: Record<LoyaltyTier, typeof Award> = { Bronze: Award, Silver: Star, Gold: Zap };

export function LoyaltyProgram() {
  const { customers } = useStore();
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {(["Bronze", "Silver", "Gold"] as LoyaltyTier[]).map((tier) => {
          const members = customers.filter((c) => c.tier === tier);
          const cfg = TIER_CONFIG[tier];
          const Icon = TIER_ICONS[tier];
          return (
            <Card key={tier} className={`p-5 gap-4 border-2 ${cfg.border}`}>
              <div className="flex items-center justify-between">
                <div className={`size-11 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`size-5 ${cfg.color}`} aria-hidden="true" />
                </div>
                <span className={`text-3xl font-bold tabular-nums ${cfg.color}`}>{members.length}</span>
              </div>
              <div>
                <div className={`font-semibold text-lg ${cfg.color}`}>{tier}</div>
                <div className="text-xs text-muted-foreground">
                  {tier === "Gold" ? "≥1,500 pts" : tier === "Silver" ? "500–1,499 pts" : "0–499 pts"}
                </div>
              </div>
              <ul className="flex flex-col gap-1.5">
                {TIER_BENEFITS[tier].map((b) => (
                  <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Gift className={`size-3 shrink-0 ${cfg.color}`} aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 gap-4">
        <h3>Points Leaderboard</h3>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Rank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Tier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Points</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total Spent</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Progress to Next</th>
              </tr>
            </thead>
            <tbody>
              {[...customers]
                .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
                .map((c, idx) => {
                  const cfg = TIER_CONFIG[c.tier];
                  const spent = totalSpent(c);
                  const nextTier = c.tier === "Bronze" ? "Silver" : c.tier === "Silver" ? "Gold" : null;
                  const nextPts = nextTier ? TIER_CONFIG[nextTier].min : null;
                  const pct = nextPts ? Math.min(100, Math.round((c.loyaltyPoints / nextPts) * 100)) : 100;
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${idx < 3 ? cfg.color : "text-muted-foreground"}`}>#{idx + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarFallback className={`${cfg.bg} ${cfg.color} text-xs font-medium`}>
                              {initials(c.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-xs`}>
                          {c.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{c.loyaltyPoints.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">₱{spent.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{c.orders.length}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        {nextTier ? (
                          <div>
                            <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-brand-light to-brand-accent-light"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(nextPts! - c.loyaltyPoints).toLocaleString()} pts to {nextTier}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs">
                            <Zap className="size-3 text-yellow-500" aria-hidden="true" />
                            <span className="text-yellow-600 font-medium">Max tier reached</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
