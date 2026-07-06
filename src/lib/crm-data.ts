// Map inventory item names → menu items that use that ingredient. This is
// presentation-only config (there's no menu_items table) and applies the
// same across every organization, so it stays a static lookup rather than
// DB-backed data.
export const inventoryToMenuMap: Record<string, string[]> = {
  "Raw Chicken Tenders": ["Chicken Tenders", "Chicken Rice Meal"],
  "Chicken Burger Fillets (Classic)": ["Classic Chicken Burger", "Classic Burger Meal"],
  "Chicken Burger Fillets (Flavored)": ["Flavored Chicken Burger", "Spicy Chicken Burger"],
  "White Rice": ["Chicken Rice Meal", "Garlic Rice"],
  "French Fries": ["French Fries", "Fries Combo"],
  "Potato Wedges": ["Potato Wedges", "Wedges Snack"],
  "Macaroni Pasta": ["Mac & Cheese"],
  "Mozzarella Sticks": ["Mozzarella Sticks", "Mozza Snack"],
  "Burger Buns": ["Classic Chicken Burger", "Flavored Chicken Burger"],
  "Cheese Sauce Base (Mac & Cheese)": ["Mac & Cheese", "Cheesy Mac"],
  "Sliced Cheddar Cheese": ["Classic Chicken Burger", "Classic Burger Meal"],
  "Fresh Lettuce": ["Classic Chicken Burger", "Classic Burger Meal"],
  "Fresh Tomatoes": ["Classic Chicken Burger", "Classic Burger Meal"],
  "Signature Dip Base": ["Dipping Sauce (2oz)", "Dipping Sauce (12oz)"],
  "Bottled Soda (Cola)": ["Cola Drink"],
};

// Tier thresholds/styling — cosmetic config shared across all organizations.
export const TIER_CONFIG = {
  Bronze: { min: 0, max: 499, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300", ring: "ring-amber-400" },
  Silver: { min: 500, max: 1499, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-300", ring: "ring-slate-400" },
  Gold: { min: 1500, max: null, color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-400", ring: "ring-yellow-500" },
} as const;
