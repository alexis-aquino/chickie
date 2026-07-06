import { Star } from "lucide-react";
import { cn } from "@/utils/cn";

interface StarsProps {
  rating: number;
  size?: "xs" | "sm";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<StarsProps["size"]>, string> = {
  xs: "size-3",
  sm: "size-3.5",
};

export function Stars({ rating, size = "sm", className }: StarsProps) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            SIZE_CLASS[size],
            i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}
