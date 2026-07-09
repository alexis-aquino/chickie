import { supabase } from "@/lib/supabase";
import type { InventoryItem, NewSupplier, PurchaseRecord, Supplier } from "@/types/inventory";
import type { Customer, Promotion } from "@/types/crm";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface StoreSnapshot {
  suppliers: Supplier[];
  inventory: InventoryItem[];
  purchaseHistory: PurchaseRecord[];
  customers: Customer[];
  promotions: Promotion[];
}

class ApiError extends Error {}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Request to ${path} failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchStoreSnapshot(): Promise<StoreSnapshot> {
  return apiFetch<StoreSnapshot>("/api/store");
}

export function submitPurchaseRecords(
  records: Omit<PurchaseRecord, "id" | "delivered">[],
): Promise<PurchaseRecord[]> {
  return apiFetch<PurchaseRecord[]>("/api/purchase-records", {
    method: "POST",
    body: JSON.stringify(records),
  });
}

export function markPurchaseDelivered(id: string): Promise<PurchaseRecord> {
  return apiFetch<PurchaseRecord>(`/api/purchase-records/${id}/deliver`, { method: "PATCH" });
}

export function createSupplier(supplier: NewSupplier): Promise<Supplier> {
  return apiFetch<Supplier>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(supplier),
  });
}

export function createInventoryItem(item: Omit<InventoryItem, "id">): Promise<InventoryItem> {
  return apiFetch<InventoryItem>("/api/inventory-items", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function updateInventoryItem(id: string, patch: Omit<InventoryItem, "id">): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/api/inventory-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteInventoryItem(id: string): Promise<void> {
  return apiFetch<void>(`/api/inventory-items/${id}`, { method: "DELETE" });
}

export function activatePromotion(id: string): Promise<Promotion> {
  return apiFetch<Promotion>(`/api/promotions/${id}/activate`, { method: "PATCH" });
}

export { ApiError };
