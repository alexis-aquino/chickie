import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/api-client";
import type { InventoryItem, PurchaseRecord, PurchaseRecordDraft, Supplier } from "@/types/inventory";
import type { Customer, LoyaltyTierConfig, Promotion } from "@/types/crm";

export interface StoreContextValue {
  loading: boolean;
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchaseHistory: PurchaseRecord[];
  customers: Customer[];
  promotions: Promotion[];
  loyaltyTiers: LoyaltyTierConfig[];
  submitOrder: (records: PurchaseRecordDraft[]) => Promise<void>;
  markDelivered: (id: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<string | null>;
  updateInventoryItem: (id: string, patch: Omit<InventoryItem, "id">) => Promise<string | null>;
  deleteInventoryItem: (id: string) => Promise<string | null>;
  activatePromotion: (id: string) => Promise<void>;
  updateLoyaltyTier: (id: string, patch: Omit<LoyaltyTierConfig, "id" | "tierName">) => Promise<string | null>;
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
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTierConfig[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setInventory([]);
      setSuppliers([]);
      setPurchaseHistory([]);
      setCustomers([]);
      setPromotions([]);
      setLoyaltyTiers([]);
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
      setLoyaltyTiers(snapshot.loyaltyTiers);
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
    let updated: PurchaseRecord;
    try {
      updated = await api.markPurchaseDelivered(id);
    } catch (error) {
      console.error("Failed to mark delivered", error);
      return;
    }
    setPurchaseHistory((prev) =>
      prev.map((r) => (r.id === id ? { ...r, delivered: true, actualDelivery: updated.actualDelivery } : r)),
    );
  };

  const updateLoyaltyTier: StoreContextValue["updateLoyaltyTier"] = async (id, patch) => {
    let updated: LoyaltyTierConfig;
    try {
      updated = await api.updateLoyaltyTier(id, patch);
    } catch (error) {
      console.error("Failed to update loyalty tier", error);
      return error instanceof Error ? error.message : "Failed to update tier.";
    }
    setLoyaltyTiers((prev) => prev.map((t) => (t.id === id ? updated : t)));
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
        loyaltyTiers,
        submitOrder,
        markDelivered,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        activatePromotion,
        updateLoyaltyTier,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
