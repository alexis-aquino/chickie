import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { initials, formatDate } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { Star, Phone, Truck, Package, Plus } from "lucide-react";

export function SuppliersGrid() {
  const { inventory, suppliers } = useStore();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card className="p-5 gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3>Suppliers</h3>
          <p className="text-sm text-muted-foreground">{suppliers.length} vendors supplying your kitchen</p>
        </div>
        <Button size="sm" className="bg-brand hover:bg-brand-dark text-white gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add Supplier
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => {
          const itemCount = inventory.filter((i) => i.supplierId === s.id).length;
          return (
            <div key={s.id} className="rounded-lg border p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium leading-tight">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.contact}</div>
                  </div>
                </div>
                <Badge variant={s.status === "Active" ? "secondary" : "outline"}>{s.status}</Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {s.categories.map((c) => (
                  <Badge key={c} variant="outline" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="size-3.5 text-amber-500" aria-hidden="true" />
                  <span className="text-foreground">{s.rating.toFixed(1)}</span> rating
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="size-3.5" aria-hidden="true" />
                  <span className="text-foreground">{s.onTimeRate}%</span> on-time
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="size-3.5" aria-hidden="true" />
                  <span className="text-foreground">{itemCount}</span> items
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" aria-hidden="true" />
                  {s.phone}
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-t pt-2">
                Last delivery: {formatDate(s.lastDelivery)}
              </div>
            </div>
          );
        })}
      </div>

      <AddSupplierDialog open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}
