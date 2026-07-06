import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { InventoryItem, PurchaseRecord, Supplier } from "@/types/inventory";
import type { Customer, CustomerOrder, FeedbackRecord, Promotion } from "@/types/crm";

export interface StoreContextValue {
  loading: boolean;
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchaseHistory: PurchaseRecord[];
  customers: Customer[];
  promotions: Promotion[];
  submitOrder: (records: Omit<PurchaseRecord, "id" | "delivered">[]) => Promise<void>;
  markDelivered: (id: string) => Promise<void>;
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
    const [
      { data: supplierRows },
      { data: itemRows },
      { data: purchaseRows },
      { data: customerRows },
      { data: orderRows },
      { data: feedbackRows },
      { data: promotionRows },
    ] = await Promise.all([
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("inventory_items").select("*").order("name"),
      supabase.from("purchase_records").select("*").order("date", { ascending: false }),
      supabase.from("customers").select("*").order("name"),
      supabase.from("customer_orders").select("*").order("date", { ascending: false }),
      supabase.from("feedback_records").select("*").order("date", { ascending: false }),
      supabase.from("promotions").select("*"),
    ]);

    setSuppliers(
      (supplierRows ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        contact: s.contact,
        phone: s.phone,
        categories: s.categories as Supplier["categories"],
        rating: s.rating,
        onTimeRate: s.on_time_rate,
        status: s.status as Supplier["status"],
        lastDelivery: s.last_delivery ?? "",
      })),
    );

    setInventory(
      (itemRows ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category as InventoryItem["category"],
        supplierId: i.supplier_id ?? "",
        unit: i.unit,
        quantity: Number(i.quantity),
        par: Number(i.par),
        reorderPoint: Number(i.reorder_point),
        unitCost: Number(i.unit_cost),
      })),
    );

    setPurchaseHistory(
      (purchaseRows ?? []).map((p) => ({
        id: p.id,
        itemId: p.item_id,
        supplierId: p.supplier_id ?? "",
        date: p.date,
        expectedDelivery: p.expected_delivery,
        quantity: Number(p.quantity),
        unitPrice: Number(p.unit_price),
        delivered: p.delivered,
      })),
    );

    const ordersByCustomer = new Map<string, CustomerOrder[]>();
    for (const o of orderRows ?? []) {
      const list = ordersByCustomer.get(o.customer_id) ?? [];
      list.push({
        id: o.id,
        date: o.date,
        items: (o.items as unknown as CustomerOrder["items"]) ?? [],
        total: Number(o.total),
        status: o.status as CustomerOrder["status"],
      });
      ordersByCustomer.set(o.customer_id, list);
    }

    const feedbackByCustomer = new Map<string, FeedbackRecord[]>();
    for (const f of feedbackRows ?? []) {
      const list = feedbackByCustomer.get(f.customer_id) ?? [];
      list.push({ id: f.id, orderId: f.order_id ?? "", date: f.date, rating: f.rating, comment: f.comment });
      feedbackByCustomer.set(f.customer_id, list);
    }

    setCustomers(
      (customerRows ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        joinDate: c.join_date,
        loyaltyPoints: c.loyalty_points,
        tier: c.tier as Customer["tier"],
        favoriteItems: c.favorite_items,
        tags: c.tags,
        orders: ordersByCustomer.get(c.id) ?? [],
        feedback: feedbackByCustomer.get(c.id) ?? [],
      })),
    );

    setPromotions(
      (promotionRows ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        discount: p.discount,
        linkedInventoryItemId: p.linked_inventory_item_id ?? "",
        linkedMenuItems: p.linked_menu_items,
        targetTiers: p.target_tiers as Promotion["targetTiers"],
        targetCustomerIds: p.target_customer_ids,
        expiresOn: p.expires_on ?? "",
        status: p.status as Promotion["status"],
        reason: p.reason,
      })),
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const submitOrder: StoreContextValue["submitOrder"] = async (records) => {
    if (!user) return;

    const { data: inserted, error } = await supabase
      .from("purchase_records")
      .insert(
        records.map((r) => ({
          organization_id: user.organizationId,
          item_id: r.itemId,
          supplier_id: r.supplierId,
          date: r.date,
          expected_delivery: r.expectedDelivery,
          quantity: r.quantity,
          unit_price: r.unitPrice,
          delivered: false,
        })),
      )
      .select("*");

    if (error || !inserted) {
      console.error("Failed to submit order", error);
      return;
    }

    // Mirror the same "latest order updates on-hand stock" behavior the
    // mock version had, applied per item across all lines just inserted.
    const byItem = new Map<string, { qty: number; price: number; supplierId: string }>();
    for (const r of inserted) {
      const existing = byItem.get(r.item_id) ?? { qty: 0, price: r.unit_price, supplierId: r.supplier_id ?? "" };
      existing.qty += Number(r.quantity);
      existing.price = Number(r.unit_price);
      existing.supplierId = r.supplier_id ?? existing.supplierId;
      byItem.set(r.item_id, existing);
    }

    await Promise.all(
      Array.from(byItem.entries()).map(([itemId, { qty, price, supplierId }]) => {
        const current = inventory.find((i) => i.id === itemId);
        if (!current) return Promise.resolve();
        return supabase
          .from("inventory_items")
          .update({ quantity: current.quantity + qty, unit_cost: price, supplier_id: supplierId })
          .eq("id", itemId);
      }),
    );

    await load();
  };

  const markDelivered: StoreContextValue["markDelivered"] = async (id) => {
    const { error } = await supabase.from("purchase_records").update({ delivered: true }).eq("id", id);
    if (error) {
      console.error("Failed to mark delivered", error);
      return;
    }
    setPurchaseHistory((prev) => prev.map((r) => (r.id === id ? { ...r, delivered: true } : r)));
  };

  const addInventoryItem: StoreContextValue["addInventoryItem"] = async (item) => {
    if (!user) return "Not signed in.";

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        organization_id: user.organizationId,
        name: item.name,
        category: item.category,
        supplier_id: item.supplierId || null,
        unit: item.unit,
        quantity: item.quantity,
        par: item.par,
        reorder_point: item.reorderPoint,
        unit_cost: item.unitCost,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Failed to add inventory item", error);
      return error?.message ?? "Failed to add item.";
    }

    setInventory((prev) =>
      [
        ...prev,
        {
          id: data.id,
          name: data.name,
          category: data.category as InventoryItem["category"],
          supplierId: data.supplier_id ?? "",
          unit: data.unit,
          quantity: Number(data.quantity),
          par: Number(data.par),
          reorderPoint: Number(data.reorder_point),
          unitCost: Number(data.unit_cost),
        },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
    return null;
  };

  const updateInventoryItem: StoreContextValue["updateInventoryItem"] = async (id, patch) => {
    const { error } = await supabase
      .from("inventory_items")
      .update({
        name: patch.name,
        category: patch.category,
        supplier_id: patch.supplierId || null,
        unit: patch.unit,
        quantity: patch.quantity,
        par: patch.par,
        reorder_point: patch.reorderPoint,
        unit_cost: patch.unitCost,
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update inventory item", error);
      return error.message;
    }

    setInventory((prev) => prev.map((i) => (i.id === id ? { ...patch, id } : i)));
    return null;
  };

  const deleteInventoryItem: StoreContextValue["deleteInventoryItem"] = async (id) => {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete inventory item", error);
      return error.message;
    }

    // Deleting an item cascades to its purchase records in the database.
    setInventory((prev) => prev.filter((i) => i.id !== id));
    setPurchaseHistory((prev) => prev.filter((r) => r.itemId !== id));
    return null;
  };

  const activatePromotion: StoreContextValue["activatePromotion"] = async (id) => {
    const { error } = await supabase.from("promotions").update({ status: "Active" }).eq("id", id);
    if (error) {
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
