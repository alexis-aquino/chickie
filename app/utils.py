from datetime import date, datetime

CATEGORIES = [
    "Meats & Proteins",
    "Carbohydrates & Sides",
    "Dairy & Produce",
    "Sauces, Dips & Seasonings",
    "Beverages",
    "Kitchen Essentials",
]

TIER_CONFIG = {
    "Bronze": {"min": 0, "max": 499},
    "Silver": {"min": 500, "max": 1499},
    "Gold": {"min": 1500, "max": None},
}

TIER_ORDER = ["Bronze", "Silver", "Gold"]

# Presentation-only config (there's no menu_items table): which menu items use
# a given inventory item, so low-stock alerts can suggest a relevant promo.
INVENTORY_TO_MENU_MAP: dict[str, list[str]] = {
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
}


def stock_status(item: dict) -> str:
    if item["quantity"] <= item["reorder_point"]:
        return "Critical"
    if item["quantity"] < item["par"] * 0.5:
        return "Low"
    return "Healthy"


def supplier_name(suppliers: list[dict], supplier_id: str | None) -> str:
    for s in suppliers:
        if s["id"] == supplier_id:
            return s["name"]
    return "Unknown"


def tier_for_points(points: int) -> str:
    if points >= TIER_CONFIG["Gold"]["min"]:
        return "Gold"
    if points >= TIER_CONFIG["Silver"]["min"]:
        return "Silver"
    return "Bronze"


def next_tier(tier: str) -> str | None:
    idx = TIER_ORDER.index(tier)
    return TIER_ORDER[idx + 1] if idx + 1 < len(TIER_ORDER) else None


def total_spent(customer: dict) -> float:
    return sum(o["total"] for o in customer["orders"] if o["status"] == "Completed")


def avg_rating(customer: dict) -> float | None:
    feedback = customer["feedback"]
    if not feedback:
        return None
    return sum(f["rating"] for f in feedback) / len(feedback)


def initials(name: str) -> str:
    parts = name.split()
    return "".join(p[0] for p in parts[:2]).upper()


def parse_date(value: str) -> date | None:
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value[: len(fmt) + 2], fmt).date()
        except ValueError:
            continue
    return None


def format_date(value: str, style: str = "short") -> str:
    d = parse_date(value)
    if d is None:
        return value or "—"
    month, day = d.strftime("%b"), str(d.day)
    if style == "long":
        return f"{month} {day}, {d.year}"
    if style == "weekday":
        return f"{d.strftime('%A')}, {month} {day}, {d.year}"
    if style == "month-year":
        return d.strftime("%b %Y")
    return f"{month} {day}"


def days_until(value: str) -> int:
    d = parse_date(value)
    if d is None:
        return 0
    return (d - date.today()).days
