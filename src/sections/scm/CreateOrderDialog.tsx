import { useState, useId, type FormEvent } from "react";
import { useStore } from "@/hooks/use-store";
import type { InventoryItem, PaymentMethod, Supplier } from "@/types/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PaymentDialog } from "./PaymentDialog";
import { Plus, Trash2, PackageCheck, ShoppingCart, Truck, Lock } from "lucide-react";
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

/**
 * Suppliers designated for an item: vendors whose categories cover the
 * item's category, always including the item's current supplier.
 */
function designatedSuppliers(suppliers: Supplier[], item: InventoryItem | undefined): Supplier[] {
  if (!item) return suppliers;
  const matches = suppliers.filter((s) => s.categories.includes(item.category) || s.id === item.supplierId);
  return matches.length > 0 ? matches : suppliers;
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
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Delivery is scheduled automatically: 3 days after the order date.
  const expectedDelivery = new Date(new Date(date).getTime() + 3 * 86400000).toISOString().slice(0, 10);
  const hasItems = lines.some((l) => l.itemId);

  const setLine = (key: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handleItemChange = (key: string, itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    const eligible = designatedSuppliers(suppliers, item);
    // Default to the item's designated supplier; when only one vendor covers
    // this item the choice is forced (the select below is locked too).
    const supplierId =
      eligible.length === 1 ? eligible[0].id : eligible.some((s) => s.id === item?.supplierId) ? (item?.supplierId ?? "") : "";
    setLine(key, {
      itemId,
      supplierId,
      unitPrice: item ? String(item.unitCost) : "",
    });
  };

  const orderTotal = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0), 0);

  const valid =
    date.length > 0 &&
    lines.length > 0 &&
    lines.every((l) => l.itemId && l.supplierId && parseFloat(l.quantity) > 0 && parseFloat(l.unitPrice) > 0);

  const [submitting, setSubmitting] = useState(false);

  // Placing the order first opens the payment step; the actual submit only
  // happens once payment is confirmed.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setPaymentOpen(true);
  };

  const handlePaid = async (method: PaymentMethod) => {
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
          paymentMethod: method,
        })),
      );

      toast.success("Order placed successfully!", {
        description: `${lines.length} item${lines.length !== 1 ? "s" : ""} · ₱${Math.round(orderTotal).toLocaleString()} via ${method} · Expected ${new Date(expectedDelivery).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      });

      setDate(today);
      setLines([blankLine()]);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto gap-5">
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
              <Label className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-brand" aria-hidden="true" />
                Expected Delivery Date
              </Label>
              <div
                className="h-9 rounded-md border bg-muted/40 px-3 flex items-center text-sm"
                aria-live="polite"
              >
                {hasItems ? (
                  <span className="font-medium">
                    {new Date(expectedDelivery).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <span className="ml-2 text-xs text-muted-foreground font-normal">(3 days after order)</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Add items below to see the delivery date</span>
                )}
              </div>
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

          <div className="hidden sm:grid grid-cols-[1.3fr_1.1fr_130px_140px_36px] gap-2 px-1 -mt-3">
            {["Item", "Supplier", "Qty", "Unit Price (₱)", ""].map((h) => (
              <span key={h} className="text-xs text-muted-foreground font-medium">
                {h}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 -mt-2">
            {lines.map((line) => {
              const selectedItem = inventory.find((i) => i.id === line.itemId);
              const eligible = designatedSuppliers(suppliers, selectedItem);
              const supplierLocked = Boolean(selectedItem) && eligible.length === 1;
              const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);

              return (
                <div key={line.key} className="rounded-xl border bg-muted/20 p-3 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_1.1fr_130px_140px_36px] gap-2 items-start">
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
                      <Select
                        value={line.supplierId}
                        onValueChange={(v) => setLine(line.key, { supplierId: v })}
                        disabled={!selectedItem || supplierLocked}
                      >
                        <SelectTrigger
                          aria-label={supplierLocked ? "Supplier (locked — sole designated vendor)" : "Supplier"}
                        >
                          <SelectValue placeholder={selectedItem ? "Supplier…" : "Pick an item first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {eligible.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {supplierLocked && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Lock className="size-3" aria-hidden="true" />
                          Sole designated supplier
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="sm:hidden text-xs text-muted-foreground">Qty</span>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0"
                          value={line.quantity}
                          onChange={(e) => setLine(line.key, { quantity: e.target.value })}
                          className={selectedItem ? "pr-12" : undefined}
                          aria-label={selectedItem ? `Quantity in ${selectedItem.unit}` : "Quantity"}
                        />
                        {selectedItem && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none select-none">
                            {selectedItem.unit}
                          </span>
                        )}
                      </div>
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
              {submitting ? "Placing Order…" : "Continue to Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={orderTotal}
        summary={`${lines.filter((l) => l.itemId).length} item${lines.filter((l) => l.itemId).length !== 1 ? "s" : ""} · Expected ${new Date(expectedDelivery).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
        onConfirm={handlePaid}
      />
    </Dialog>
  );
}
