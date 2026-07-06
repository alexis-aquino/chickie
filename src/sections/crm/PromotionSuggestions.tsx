import { useStore } from "@/hooks/use-store";
import { TIER_CONFIG, inventoryToMenuMap } from "@/lib/crm-data";
import { stockStatus } from "@/utils/inventory";
import { initials, formatDate } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, AlertTriangle, Package, Users, Calendar, CheckCircle2, Clock, Tag } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-300",
  Draft: "bg-amber-50 text-amber-700 border-amber-300",
  Expired: "bg-muted text-muted-foreground border-border",
};

export function PromotionSuggestions() {
  const { inventory, customers, promotions, activatePromotion } = useStore();

  const handleActivate = async (title: string, id: string) => {
    await activatePromotion(id);
    toast.success(`"${title}" is now active.`);
  };

  // Surface any Low/Critical items that don't yet have a promotion
  const unlinkedAlerts = inventory.filter((item) => {
    const s = stockStatus(item);
    const hasPromo = promotions.some((p) => p.linkedInventoryItemId === item.id && p.status === "Active");
    return (s === "Low" || s === "Critical") && !hasPromo && inventoryToMenuMap[item.name];
  });

  return (
    <div className="flex flex-col gap-5">
      {unlinkedAlerts.length > 0 && (
        <Card className="p-5 gap-3 border-amber-300 bg-amber-50/40">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-600" aria-hidden="true" />
            <h3 className="text-amber-800">New Promotion Opportunities from SCM</h3>
          </div>
          <p className="text-sm text-amber-700">
            These inventory items are Low or Critical and have matching menu items — consider creating a promotion.
          </p>
          <div className="flex flex-wrap gap-2">
            {unlinkedAlerts.map((item) => {
              const pct = Math.round((item.quantity / item.par) * 100);
              return (
                <div key={item.id} className="rounded-lg bg-white border border-amber-200 px-3 py-2 flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-3.5 text-amber-600" aria-hidden="true" />
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{pct}% of par</span>
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                    {inventoryToMenuMap[item.name]?.[0]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {promotions.map((promo) => {
          const item = inventory.find((i) => i.id === promo.linkedInventoryItemId);
          const targets = customers.filter((c) => promo.targetCustomerIds.includes(c.id));
          const pct = item ? Math.round((item.quantity / item.par) * 100) : 0;
          const status = item ? stockStatus(item) : null;

          return (
            <Card key={promo.id} className="p-5 gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-brand-light to-brand-accent-light flex items-center justify-center shrink-0">
                    <Tag className="size-4 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="leading-tight">{promo.title}</h3>
                      <Badge variant="outline" className={STATUS_STYLES[promo.status]}>
                        {promo.status === "Active" ? (
                          <CheckCircle2 className="size-3 mr-1" aria-hidden="true" />
                        ) : (
                          <Clock className="size-3 mr-1" aria-hidden="true" />
                        )}
                        {promo.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{promo.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-brand">{promo.discount}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                    <Calendar className="size-3" aria-hidden="true" />
                    Expires {formatDate(promo.expiresOn, "long")}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm">
                  <span className="font-medium text-amber-800">SCM Trigger: </span>
                  <span className="text-amber-700">{promo.reason}</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Package className="size-3.5" aria-hidden="true" /> Linked Inventory
                  </div>
                  {item && status && (
                    <div className="rounded-lg border p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge
                          variant="outline"
                          className={
                            status === "Critical"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : status === "Low"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-1.5 [&>div]:bg-amber-500" />
                      <div className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit} on hand · {pct}% of par
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Tag className="size-3.5" aria-hidden="true" /> Affected Menu Items
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {promo.linkedMenuItems.map((m) => (
                      <Badge key={m} variant="outline" className="text-xs">
                        {m}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {promo.targetTiers.map((t) => {
                      const cfg = TIER_CONFIG[t];
                      return (
                        <Badge key={t} variant="outline" className={`text-xs ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {t}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Users className="size-3.5" aria-hidden="true" /> Target Customers ({targets.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {targets.map((c) => {
                    const cfg = TIER_CONFIG[c.tier];
                    return (
                      <div key={c.id} className="flex items-center gap-1.5 rounded-lg border bg-muted/20 px-2.5 py-1.5 text-sm">
                        <Avatar className="size-5">
                          <AvatarFallback className={`${cfg.bg} ${cfg.color} text-[10px] font-medium`}>
                            {initials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{c.name}</span>
                        <span className={`text-[10px] ${cfg.color}`}>{c.tier}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {promo.status === "Draft" && (
                <div className="flex gap-2 pt-1 border-t">
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand-dark text-white gap-1.5"
                    onClick={() => handleActivate(promo.title, promo.id)}
                  >
                    <Zap className="size-3.5" aria-hidden="true" /> Activate Promotion
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
