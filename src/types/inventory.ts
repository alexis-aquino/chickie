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

export type PaymentMethod = "Cash" | "GCash" | "Card" | "QR Ph";

export interface PurchaseRecord {
  id: string;
  itemId: string;
  supplierId: string;
  date: string;
  expectedDelivery: string;
  quantity: number;
  unitPrice: number;
  delivered: boolean;
  paymentMethod: string;
}

export type NewSupplier = Pick<Supplier, "name" | "contact" | "phone" | "categories" | "status">;
