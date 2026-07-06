import type { Customer, LoyaltyTier } from "@/types/crm";

export function tierForPoints(pts: number): LoyaltyTier {
  if (pts >= 1500) return "Gold";
  if (pts >= 500) return "Silver";
  return "Bronze";
}

export function totalSpent(c: Customer) {
  return c.orders.filter((o) => o.status === "Completed").reduce((s, o) => s + o.total, 0);
}

export function avgRating(c: Customer) {
  if (!c.feedback.length) return null;
  return c.feedback.reduce((s, f) => s + f.rating, 0) / c.feedback.length;
}
