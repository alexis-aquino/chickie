import { useEffect, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { fetchInventoryByCategoryChartUrl } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function CategoryChart() {
  const { inventory } = useStore();
  const [chartUrl, setChartUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    fetchInventoryByCategoryChartUrl()
      .then((url) => {
        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setChartUrl(url);
        setError(false);
      })
      .catch(() => active && setError(true));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Re-fetch whenever inventory changes so the server-rendered chart stays in sync.
  }, [inventory]);

  return (
    <Card className="p-5 gap-4">
      <div>
        <h3>Inventory Value by Category</h3>
        <p className="text-sm text-muted-foreground">Estimated on-hand value (PHP) — rendered by the Python backend</p>
      </div>
      {error ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <BarChart3 className="size-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Couldn&apos;t load the chart from the backend.</p>
        </div>
      ) : chartUrl ? (
        <img src={chartUrl} alt="Bar chart of inventory value by category" className="w-full h-64 object-contain" />
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="size-6 rounded-full border-2 border-muted-foreground/30 border-t-brand animate-spin" />
        </div>
      )}
    </Card>
  );
}
