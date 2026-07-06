import type { InventoryItem, StockStatus, Supplier } from "@/types/inventory";

export function stockStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= item.reorderPoint) return "Critical";
  if (item.quantity < item.par * 0.5) return "Low";
  return "Healthy";
}

export function supplierName(suppliers: Supplier[], id: string): string {
  return suppliers.find((s) => s.id === id)?.name ?? "Unknown";
}
