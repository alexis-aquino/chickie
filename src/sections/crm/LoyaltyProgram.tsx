import { useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { TIER_CONFIG } from "@/lib/crm-data";
import type { LoyaltyTier, LoyaltyTierConfig } from "@/types/crm";
import { totalSpent } from "@/utils/crm";
import { initials } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Gift, Pencil, Star, Zap } from "lucide-react";
import { toast } from "sonner";

const TIER_ICONS: Record<LoyaltyTier, typeof Award> = { Bronze: Award, Silver: Star, Gold: Zap };

function pointsRateLabel(pointsPerPeso: number) {
  const per10 = pointsPerPeso * 10;
  return `${Number(per10.toFixed(2))} pt${per10 === 1 ? "" : "s"} per ₱10 spent`;
}

function rangeLabel(t: LoyaltyTierConfig) {
  return t.maxPoints === null
    ? `≥${t.minPoints.toLocaleString()} pts`
    : `${t.minPoints.toLocaleString()}–${t.maxPoints.toLocaleString()} pts`;
}

function TierEditDialog({
  tier,
  onClose,
}: {
  tier: LoyaltyTierConfig;
  onClose: () => void;
}) {
  const { updateLoyaltyTier } = useStore();
  const [minPoints, setMinPoints] = useState(String(tier.minPoints));
  const [maxPoints, setMaxPoints] = useState(tier.maxPoints === null ? "" : String(tier.maxPoints));
  const [pointsPerPeso, setPointsPerPeso] = useState(String(tier.pointsPerPeso));
  const [perksText, setPerksText] = useState(tier.perks.join("\n"));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const min = Number(minPoints);
    const max = maxPoints.trim() === "" ? null : Number(maxPoints);
    const ppp = Number(pointsPerPeso);
    if (!Number.isFinite(min) || min < 0 || (max !== null && (!Number.isFinite(max) || max <= min)) || !Number.isFinite(ppp) || ppp <= 0) {
      toast.error("Check the numbers — max must be above min, and the earn rate must be positive.");
      return;
    }
    const perks = perksText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    setSaving(true);
    const err = await updateLoyaltyTier(tier.id, { minPoints: min, maxPoints: max, pointsPerPeso: ppp, perks });
    setSaving(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(`${tier.tierName} tier updated!`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {tier.tierName} Tier</DialogTitle>
          <DialogDescription>Point thresholds, earn rate, and member perks for this tier.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`min-${tier.id}`}>Min points</Label>
              <Input
                id={`min-${tier.id}`}
                type="number"
                min={0}
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`max-${tier.id}`}>Max points</Label>
              <Input
                id={`max-${tier.id}`}
                type="number"
                min={0}
                placeholder="No cap"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`ppp-${tier.id}`}>Points earned per ₱1 spent</Label>
            <Input
              id={`ppp-${tier.id}`}
              type="number"
              step="0.01"
              min={0}
              value={pointsPerPeso}
              onChange={(e) => setPointsPerPeso(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{pointsRateLabel(Number(pointsPerPeso) || 0)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`perks-${tier.id}`}>Perks (one per line)</Label>
            <Textarea
              id={`perks-${tier.id}`}
              rows={4}
              value={perksText}
              onChange={(e) => setPerksText(e.target.value)}
              placeholder={"Birthday treat\nEarly promo access"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-brand hover:bg-brand-dark text-white" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Tier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LoyaltyProgram() {
  const { customers, loyaltyTiers } = useStore();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const [editing, setEditing] = useState<LoyaltyTierConfig | null>(null);

  const tiers = useMemo(
    () => [...loyaltyTiers].sort((a, b) => a.minPoints - b.minPoints),
    [loyaltyTiers],
  );
  const thresholdFor = (tierName: LoyaltyTier) => tiers.find((t) => t.tierName === tierName)?.minPoints ?? TIER_CONFIG[tierName].min;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((t) => {
          const members = customers.filter((c) => c.tier === t.tierName);
          const cfg = TIER_CONFIG[t.tierName];
          const Icon = TIER_ICONS[t.tierName];
          return (
            <Card key={t.id} className={`p-5 gap-4 border-2 ${cfg.border} relative`}>
              <div className="flex items-center justify-between">
                <div className={`size-11 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`size-5 ${cfg.color}`} aria-hidden="true" />
                </div>
                <span className={`text-3xl font-bold tabular-nums ${cfg.color}`}>{members.length}</span>
              </div>
              <div>
                <div className={`font-semibold text-lg ${cfg.color}`}>{t.tierName}</div>
                <div className="text-xs text-muted-foreground">{rangeLabel(t)}</div>
              </div>
              <ul className="flex flex-col gap-1.5">
                <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gift className={`size-3 shrink-0 ${cfg.color}`} aria-hidden="true" />
                  {pointsRateLabel(t.pointsPerPeso)}
                </li>
                {t.perks.map((b) => (
                  <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Gift className={`size-3 shrink-0 ${cfg.color}`} aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-3 right-3 size-7 p-0 text-muted-foreground hover:text-foreground"
                  aria-label={`Edit ${t.tierName} tier`}
                  onClick={() => setEditing(t)}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                </Button>
              )}
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
                  const nextPts = nextTier ? thresholdFor(nextTier) : null;
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
                        {nextTier && nextPts ? (
                          <div>
                            <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-brand-light to-brand-accent-light"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.max(0, nextPts - c.loyaltyPoints).toLocaleString()} pts to {nextTier}
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

      {editing && <TierEditDialog tier={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
