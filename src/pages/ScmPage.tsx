import { lazy, Suspense, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { stockStatus, supplierName } from "@/utils/inventory";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "@/sections/scm/InventoryTable";
import { SuppliersGrid } from "@/sections/scm/SuppliersGrid";
import { DeliverySchedule } from "@/sections/scm/DeliverySchedule";
import { PurchaseHistory } from "@/sections/scm/PurchaseHistory";
import { TransactionHistory } from "@/sections/scm/TransactionHistory";
import { Package, Users, AlertTriangle, PhilippinePeso } from "lucide-react";

// recharts is the single heaviest dependency in the bundle; only owners
// viewing the Analytics tab need it, so split it into its own chunk.
const CategoryChart = lazy(() =>
  import("@/sections/scm/CategoryChart").then((m) => ({ default: m.CategoryChart })),
);

const OWNER_ONLY_TABS = new Set(["history", "analytics"]);
const VALID_TABS = ["inventory", "suppliers", "purchases", "deliveries", "history", "analytics"];
// Supplier accounts only manage their side of the pipeline: incoming
// purchase orders and the deliveries they need to fulfil.
const SUPPLIER_TABS = new Set(["purchases", "deliveries"]);

export function ScmPage() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { inventory, suppliers } = useStore();
  const isOwner = user?.role === "owner";
  const isSupplier = user?.role === "supplier";

  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const reorder = inventory.filter((i) => stockStatus(i) === "Critical");
    const low = inventory.filter((i) => stockStatus(i) === "Low");
    const activeSuppliers = suppliers.filter((s) => s.status === "Active").length;
    return { totalValue, reorder, low, activeSuppliers };
  }, [inventory, suppliers]);

  if (tab === "transactions") {
    return <Navigate to="/dashboard/scm/history" replace />;
  }
  if (isSupplier && (!tab || !SUPPLIER_TABS.has(tab))) {
    return <Navigate to="/dashboard/scm/deliveries" replace />;
  }
  if (!tab || !VALID_TABS.includes(tab) || (OWNER_ONLY_TABS.has(tab) && !isOwner)) {
    return <Navigate to="/dashboard/scm/inventory" replace />;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>Welcome back, {user?.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm">
            {isSupplier
              ? "Here are the orders and deliveries waiting on you."
              : "Here's how your kitchen supply looks today."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {isOwner && (
          <StatCard
            label="Inventory Value"
            value={`₱${Math.round(stats.totalValue).toLocaleString()}`}
            sublabel={`${inventory.length} tracked items`}
            icon={PhilippinePeso}
            accent="text-emerald-600"
          />
        )}
        <StatCard
          label="Active Suppliers"
          value={String(stats.activeSuppliers)}
          sublabel={`${suppliers.length} total vendors`}
          icon={Users}
          accent="text-brand"
        />
        <StatCard
          label="Needs Reorder"
          value={String(stats.reorder.length)}
          sublabel="At or below reorder point"
          icon={AlertTriangle}
          accent="text-destructive"
        />
        <StatCard
          label="Running Low"
          value={String(stats.low.length)}
          sublabel="Below 50% of par level"
          icon={Package}
          accent="text-amber-500"
        />
      </div>

      {stats.reorder.length > 0 && (
        <Card className="p-5 gap-3 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
            <h3 className="text-destructive">Reorder Alerts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.reorder.map((item) => (
              <Badge key={item.id} variant="outline" className="bg-background border-destructive/30 py-1">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground ml-1">
                  — {item.quantity} {item.unit} left · {supplierName(suppliers, item.supplierId)}
                </span>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => navigate(`/dashboard/scm/${v}`)} className="gap-4">
        <TabsList>
          {!isSupplier && <TabsTrigger value="inventory">Inventory</TabsTrigger>}
          {!isSupplier && <TabsTrigger value="suppliers">Suppliers</TabsTrigger>}
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-1.5">
            Deliveries
            {stats.reorder.length > 0 && (
              <span className="size-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center leading-none">
                !
              </span>
            )}
          </TabsTrigger>
          {isOwner && <TabsTrigger value="history">History</TabsTrigger>}
          {isOwner && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>
        {!isSupplier && (
          <TabsContent value="inventory">
            <InventoryTable />
          </TabsContent>
        )}
        {!isSupplier && (
          <TabsContent value="suppliers">
            <SuppliersGrid />
          </TabsContent>
        )}
        <TabsContent value="purchases">
          <PurchaseHistory />
        </TabsContent>
        <TabsContent value="deliveries">
          <DeliverySchedule />
        </TabsContent>
        {isOwner && (
          <TabsContent value="history">
            <TransactionHistory />
          </TabsContent>
        )}
        {isOwner && (
          <TabsContent value="analytics">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
              <CategoryChart />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
