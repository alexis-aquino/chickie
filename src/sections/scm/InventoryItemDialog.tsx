import { useEffect, useId, useState, type FormEvent } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import type { Category, InventoryItem } from "@/types/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: Category[] = [
  "Meats & Proteins",
  "Carbohydrates & Sides",
  "Dairy & Produce",
  "Sauces, Dips & Seasonings",
  "Beverages",
  "Kitchen Essentials",
];

const NO_SUPPLIER = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When present, the dialog edits this item; otherwise it creates a new one. */
  item?: InventoryItem | null;
}

function blankForm() {
  return {
    name: "",
    category: "" as Category | "",
    supplierId: NO_SUPPLIER,
    unit: "",
    quantity: "",
    par: "",
    reorderPoint: "",
    unitCost: "",
  };
}

export function InventoryItemDialog({ open, onOpenChange, item }: Props) {
  const { suppliers, addInventoryItem, updateInventoryItem } = useStore();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const uid = useId();
  const isEdit = !!item;

  const [form, setForm] = useState(blankForm());
  const [submitting, setSubmitting] = useState(false);

  // Re-sync the form whenever the dialog is (re)opened for a given item, or
  // switched between add/edit.
  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        name: item.name,
        category: item.category,
        supplierId: item.supplierId || NO_SUPPLIER,
        unit: item.unit,
        quantity: String(item.quantity),
        par: String(item.par),
        reorderPoint: String(item.reorderPoint),
        unitCost: String(item.unitCost),
      });
    } else {
      setForm(blankForm());
    }
  }, [open, item]);

  const valid =
    form.name.trim().length > 0 &&
    form.category.length > 0 &&
    form.unit.trim().length > 0 &&
    form.quantity !== "" &&
    form.par !== "" &&
    form.reorderPoint !== "" &&
    Number(form.quantity) >= 0 &&
    Number(form.par) >= 0 &&
    Number(form.reorderPoint) >= 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    try {
      const payload: Omit<InventoryItem, "id"> = {
        name: form.name.trim(),
        category: form.category as Category,
        supplierId: form.supplierId === NO_SUPPLIER ? "" : form.supplierId,
        unit: form.unit.trim(),
        quantity: Number(form.quantity),
        par: Number(form.par),
        reorderPoint: Number(form.reorderPoint),
        unitCost: isOwner ? Number(form.unitCost || 0) : (item?.unitCost ?? 0),
      };

      const errorMessage = isEdit ? await updateInventoryItem(item!.id, payload) : await addInventoryItem(payload);

      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }

      toast.success(isEdit ? "Item updated!" : "Item added to inventory!");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto gap-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Package className="size-5 text-brand" aria-hidden="true" />
            {isEdit ? "Edit Inventory Item" : "Add Inventory Item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-name`}>Item Name</Label>
            <Input
              id={`${uid}-name`}
              placeholder="e.g. Raw Chicken Tenders"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-category`}>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                <SelectTrigger id={`${uid}-category`}>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-supplier`}>Supplier</Label>
              <Select value={form.supplierId} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}>
                <SelectTrigger id={`${uid}-supplier`}>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUPPLIER}>No supplier yet</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-unit`}>Unit</Label>
              <Input
                id={`${uid}-unit`}
                placeholder="kg, pcs, L…"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-qty`}>Quantity on Hand</Label>
              <Input
                id={`${uid}-qty`}
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-par`}>Par Level</Label>
              <Input
                id={`${uid}-par`}
                type="number"
                min="0"
                step="0.01"
                value={form.par}
                onChange={(e) => setForm((f) => ({ ...f, par: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-reorder`}>Reorder Point</Label>
              <Input
                id={`${uid}-reorder`}
                type="number"
                min="0"
                step="0.01"
                value={form.reorderPoint}
                onChange={(e) => setForm((f) => ({ ...f, reorderPoint: e.target.value }))}
                required
              />
            </div>
          </div>

          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-cost`}>Unit Cost (₱)</Label>
              <Input
                id={`${uid}-cost`}
                type="number"
                min="0"
                step="0.01"
                value={form.unitCost}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
              />
            </div>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || submitting} className="bg-brand hover:bg-brand-dark text-white">
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
