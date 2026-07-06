import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import type { Category } from "@/types/inventory";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function CategoryChart() {
  const { inventory } = useStore();
  const data = useMemo(() => {
    const map = new Map<Category, number>();
    for (const item of inventory) {
      const value = item.quantity * item.unitCost;
      map.set(item.category, (map.get(item.category) ?? 0) + value);
    }
    return Array.from(map.entries()).map(([category, value]) => ({
      category,
      value: Math.round(value),
    }));
  }, [inventory]);

  return (
    <Card className="p-5 gap-4">
      <div>
        <h3>Inventory Value by Category</h3>
        <p className="text-sm text-muted-foreground">Estimated on-hand value (PHP)</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(v: number) => [`₱${v.toLocaleString()}`, "Value"]}
            />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
