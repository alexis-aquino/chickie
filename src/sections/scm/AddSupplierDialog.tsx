import { useState, useId, type FormEvent } from "react";
import { useStore } from "@/hooks/use-store";
import type { Category } from "@/types/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: Category[] = [
  "Meats & Proteins",
  "Carbohydrates & Sides",
  "Dairy & Produce",
  "Sauces, Dips & Seasonings",
  "Beverages",
  "Kitchen Essentials",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AddSupplierDialog({ open, onOpenChange }: Props) {
  const { addSupplier } = useStore();
  const uid = useId();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"Active" | "On Hold">("Active");
  const [saving, setSaving] = useState(false);

  const toggleCategory = (c: Category) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const valid = name.trim().length > 0 && contact.trim().length > 0 && phone.trim().length > 0 && categories.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;

    setSaving(true);
    try {
      const error = await addSupplier({
        name: name.trim(),
        contact: contact.trim(),
        phone: phone.trim(),
        categories,
        status,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`${name.trim()} added to your suppliers.`);
      setName("");
      setContact("");
      setPhone("");
      setCategories([]);
      setStatus("Active");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Truck className="size-5 text-brand" aria-hidden="true" />
            Add Supplier
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-name`}>Company Name</Label>
            <Input
              id={`${uid}-name`}
              placeholder="Magnolia Poultry Supply"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-contact`}>Contact Person</Label>
              <Input
                id={`${uid}-contact`}
                placeholder="Juan dela Cruz"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-phone`}>Phone</Label>
              <Input
                id={`${uid}-phone`}
                placeholder="0917 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Supplies Categories</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = categories.includes(c);
                return (
                  <button key={c} type="button" onClick={() => toggleCategory(c)} aria-pressed={active}>
                    <Badge
                      variant={active ? "default" : "outline"}
                      className={active ? "bg-brand hover:bg-brand-dark cursor-pointer" : "cursor-pointer hover:bg-muted"}
                    >
                      {c}
                    </Badge>
                  </button>
                );
              })}
            </div>
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground">Pick at least one category this vendor supplies.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-status`}>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "Active" | "On Hold")}>
              <SelectTrigger id={`${uid}-status`} className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || saving} className="bg-brand hover:bg-brand-dark text-white">
              {saving ? "Adding…" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
