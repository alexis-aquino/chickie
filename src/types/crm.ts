export type LoyaltyTier = "Bronze" | "Silver" | "Gold";

/** Org-configurable loyalty tier settings (DB-backed). */
export interface LoyaltyTierConfig {
  id: string;
  tierName: LoyaltyTier;
  minPoints: number;
  maxPoints: number | null;
  pointsPerPeso: number;
  perks: string[];
}

export interface CustomerOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface CustomerOrder {
  id: string;
  date: string;
  items: CustomerOrderItem[];
  total: number;
  status: "Completed" | "Cancelled";
}

export interface FeedbackRecord {
  id: string;
  orderId: string;
  date: string;
  /** 1-5 */
  rating: number;
  comment: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  loyaltyPoints: number;
  tier: LoyaltyTier;
  orders: CustomerOrder[];
  feedback: FeedbackRecord[];
  favoriteItems: string[];
  tags: string[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  linkedInventoryItemId: string;
  linkedMenuItems: string[];
  targetTiers: LoyaltyTier[];
  targetCustomerIds: string[];
  expiresOn: string;
  status: "Active" | "Draft" | "Expired";
  /** SCM trigger reason */
  reason: string;
}
