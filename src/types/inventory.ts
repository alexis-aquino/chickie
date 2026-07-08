export type Category =
  | "Meats & Proteins"
  | "Carbohydrates & Sides"
  | "Dairy & Produce"
  | "Sauces, Dips & Seasonings"
  | "Beverages"
  | "Kitchen Essentials";

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  categories: Category[];
  rating: number;
  onTimeRate: number;
  status: "Active" | "On Hold";
  lastDelivery: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  supplierId: string;
  unit: string;
  quantity: number;
  par: number;
  reorderPoint: number;
  unitCost: number;
}

export type StockStatus = "Critical" | "Low" | "Healthy";

export interface PurchaseRecord {
  id: string;
  itemId: string;
  supplierId: string;
  date: string;
  expectedDelivery: string;
  /** Set when the order is marked delivered; empty until then. */
  actualDelivery: string;
  quantity: number;
  unitPrice: number;
  delivered: boolean;
  /** Display name of the staff member who logged the order. */
  createdByName: string;
}

/** Fields the client supplies when logging a new order line. */
export type PurchaseRecordDraft = Pick<
  PurchaseRecord,
  "itemId" | "supplierId" | "date" | "expectedDelivery" | "quantity" | "unitPrice"
>;
