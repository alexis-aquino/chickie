import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  accent?: string;
}

export function StatCard({ label, value, sublabel, icon: Icon, accent = "text-primary" }: StatCardProps) {
  return (
    <Card className="p-5 gap-3">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`size-5 ${accent}`} aria-hidden="true" />
      </div>
      <div>
        <div className="text-2xl font-medium tabular-nums">{value}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
      </div>
    </Card>
  );
}
