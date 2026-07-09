import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/api-client";
import type { InventoryItem, NewSupplier, PurchaseRecord, Supplier } from "@/types/inventory";
import type { Customer, Promotion } from "@/types/crm";

export interface StoreContextValue {
  loading: boolean;
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchaseHistory: PurchaseRecord[];
  customers: Customer[];
  promotions: Promotion[];
  submitOrder: (records: Omit<PurchaseRecord, "id" | "delivered">[]) => Promise<void>;
  markDelivered: (id: string) => Promise<void>;
  addSupplier: (supplier: NewSupplier) => Promise<string | null>;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<string | null>;
  updateInventoryItem: (id: string, patch: Omit<InventoryItem, "id">) => Promise<string | null>;
  deleteInventoryItem: (id: string) => Promise<string | null>;
  activatePromotion: (id: string) => Promise<void>;
}

export const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setInventory([]);
      setSuppliers([]);
      setPurchaseHistory([]);
      setCustomers([]);
      setPromotions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const snapshot = await api.fetchStoreSnapshot();
      setSuppliers(snapshot.suppliers);
      setInventory(snapshot.inventory);
      setPurchaseHistory(snapshot.purchaseHistory);
      setCustomers(snapshot.customers);
      setPromotions(snapshot.promotions);
    } catch (error) {
      console.error("Failed to load store data", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const submitOrder: StoreContextValue["submitOrder"] = async (records) => {
    if (!user) return;

    try {
      await api.submitPurchaseRecords(records);
    } catch (error) {
      console.error("Failed to submit order", error);
      return;
    }

    await load();
  };

  const markDelivered: StoreContextValue["markDelivered"] = async (id) => {
    try {
      await api.markPurchaseDelivered(id);
    } catch (error) {
      console.error("Failed to mark delivered", error);
      return;
    }
    const record = purchaseHistory.find((r) => r.id === id);
    setPurchaseHistory((prev) => prev.map((r) => (r.id === id ? { ...r, delivered: true } : r)));
    // Receiving a delivery is what puts stock on the shelf — mirror the
    // backend's bump so the Inventory tab reflects it without a refetch.
    if (record && !record.delivered) {
      setInventory((prev) =>
        prev.map((i) =>
          i.id === record.itemId
            ? {
                ...i,
                quantity: i.quantity + record.quantity,
                unitCost: record.unitPrice,
                supplierId: record.supplierId || i.supplierId,
              }
            : i,
        ),
      );
    }
  };

  const addSupplier: StoreContextValue["addSupplier"] = async (supplier) => {
    if (!user) return "Not signed in.";

    let created: Supplier;
    try {
      created = await api.createSupplier(supplier);
    } catch (error) {
      console.error("Failed to add supplier", error);
      return error instanceof Error ? error.message : "Failed to add supplier.";
    }

    setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return null;
  };

  const addInventoryItem: StoreContextValue["addInventoryItem"] = async (item) => {
    if (!user) return "Not signed in.";

    let created: InventoryItem;
    try {
      created = await api.createInventoryItem(item);
    } catch (error) {
      console.error("Failed to add inventory item", error);
      return error instanceof Error ? error.message : "Failed to add item.";
    }

    setInventory((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return null;
  };

  const updateInventoryItem: StoreContextValue["updateInventoryItem"] = async (id, patch) => {
    try {
      await api.updateInventoryItem(id, patch);
    } catch (error) {
      console.error("Failed to update inventory item", error);
      return error instanceof Error ? error.message : "Failed to update item.";
    }

    setInventory((prev) => prev.map((i) => (i.id === id ? { ...patch, id } : i)));
    return null;
  };

  const deleteInventoryItem: StoreContextValue["deleteInventoryItem"] = async (id) => {
    try {
      await api.deleteInventoryItem(id);
    } catch (error) {
      console.error("Failed to delete inventory item", error);
      return error instanceof Error ? error.message : "Failed to delete item.";
    }

    // Deleting an item cascades to its purchase records in the database.
    setInventory((prev) => prev.filter((i) => i.id !== id));
    setPurchaseHistory((prev) => prev.filter((r) => r.itemId !== id));
    return null;
  };

  const activatePromotion: StoreContextValue["activatePromotion"] = async (id) => {
    try {
      await api.activatePromotion(id);
    } catch (error) {
      console.error("Failed to activate promotion", error);
      return;
    }
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Active" } : p)));
  };

  return (
    <StoreContext.Provider
      value={{
        loading,
        inventory,
        suppliers,
        purchaseHistory,
        customers,
        promotions,
        submitOrder,
        markDelivered,
        addSupplier,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        activatePromotion,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
