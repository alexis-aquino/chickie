import { useState, useId, type FormEvent } from "react";
import { useStore } from "@/hooks/use-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";

interface LineItem {
  key: string;
  itemId: string;
  supplierId: string;
  quantity: string;
  unitPrice: string;
}

function blankLine(): LineItem {
  return {
    key: String(Date.now() + Math.random()),
    itemId: "",
    supplierId: "",
    quantity: "",
    unitPrice: "",
  };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CreateOrderDialog({ open, onOpenChange }: Props) {
  const { inventory, suppliers, submitOrder } = useStore();
  const uid = useId();
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const defaultDelivery = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const [expectedDelivery, setExpectedDelivery] = useState(defaultDelivery);
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);

  const setLine = (key: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handleItemChange = (key: string, itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    setLine(key, {
      itemId,
      supplierId: item?.supplierId ?? "",
      unitPrice: item ? String(item.unitCost) : "",
    });
  };

  const orderTotal = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0), 0);

  const valid =
    date.length > 0 &&
    expectedDelivery.length > 0 &&
    expectedDelivery >= date &&
    lines.length > 0 &&
    lines.every((l) => l.itemId && l.supplierId && parseFloat(l.quantity) > 0 && parseFloat(l.unitPrice) > 0);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    try {
      await submitOrder(
        lines.map((l) => ({
          itemId: l.itemId,
          supplierId: l.supplierId,
          date,
          expectedDelivery,
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unitPrice),
        })),
      );

      toast.success("Order placed successfully!", {
        description: `${lines.length} item${lines.length !== 1 ? "s" : ""} · ₱${Math.round(orderTotal).toLocaleString()} · Expected ${new Date(expectedDelivery).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      });

      setDate(today);
      setExpectedDelivery(defaultDelivery);
      setLines([blankLine()]);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto gap-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-5 text-brand" aria-hidden="true" />
            Create New Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-date`}>Order Date</Label>
              <Input id={`${uid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-delivery`} className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-brand" aria-hidden="true" />
                Expected Delivery Date
              </Label>
              <Input
                id={`${uid}-delivery`}
                type="date"
                value={expectedDelivery}
                min={date}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                required
              />
              {expectedDelivery && expectedDelivery < date && (
                <p className="text-xs text-destructive" role="alert">
                  Must be on or after the order date.
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Order Items</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setLines((p) => [...p, blankLine()])}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add Item
            </Button>
          </div>

          <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_120px_36px] gap-2 px-1 -mt-3">
            {["Item", "Supplier", "Qty", "Unit Price (₱)", ""].map((h) => (
              <span key={h} className="text-xs text-muted-foreground font-medium">
                {h}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 -mt-2">
            {lines.map((line) => {
              const selectedItem = inventory.find((i) => i.id === line.itemId);
              const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);

              return (
                <div key={line.key} className="rounded-xl border bg-muted/20 p-3 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_120px_36px] gap-2 items-start">
                    <div className="flex flex-col gap-1">
                      <span className="sm:hidden text-xs text-muted-foreground">Item</span>
                      <Select value={line.itemId} onValueChange={(v) => handleItemChange(line.key, v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item…" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                              <span className="ml-1 text-xs text-muted-foreground">/{item.unit}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="sm:hidden text-xs text-muted-foreground">Supplier</span>
                      <Select value={line.supplierId} onValueChange={(v) => setLine(line.key, { supplierId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Supplier…" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="sm:hidden text-xs text-muted-foreground">Qty</span>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0"
                        value={line.quantity}
                        onChange={(e) => setLine(line.key, { quantity: e.target.value })}
                        aria-label="Quantity"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="sm:hidden text-xs text-muted-foreground">Unit Price</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">
                          ₱
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={line.unitPrice}
                          onChange={(e) => setLine(line.key, { unitPrice: e.target.value })}
                          className="pl-6"
                          aria-label="Unit price"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={lines.length === 1}
                        onClick={() => setLines((p) => p.filter((l) => l.key !== line.key))}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove line item"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {line.itemId && line.quantity && line.unitPrice && (
                    <div className="flex items-center justify-between px-1 pt-1 border-t">
                      <div className="flex items-center gap-2">
                        {selectedItem && (
                          <Badge variant="outline" className="text-xs">
                            {selectedItem.category}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {line.quantity} {selectedItem?.unit} × ₱{parseFloat(line.unitPrice).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">₱{lineTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between px-1">
            <span className="font-medium">Order Total</span>
            <span className="text-2xl font-medium tabular-nums text-brand">₱{Math.round(orderTotal).toLocaleString()}</span>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || submitting} className="bg-brand hover:bg-brand-dark text-white gap-1.5">
              <PackageCheck className="size-4" aria-hidden="true" />
              {submitting ? "Placing Order…" : "Place Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
