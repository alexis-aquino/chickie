import uuid
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app import models


def seed_demo_data(db: Session, organization_id: str) -> None:
    """Populates a freshly-created organization with sample suppliers,
    inventory, purchase history, customers, and promotions so a new signup
    has something to explore instead of empty dashboards."""

    today = date.today()

    suppliers = [
        models.Supplier(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            name="Golden Poultry Farms",
            contact="Ana Reyes",
            phone="+63 917 555 0110",
            categories=["Meats & Proteins"],
            rating=4.6,
            on_time_rate=94.0,
            status="Active",
            last_delivery=str(today - timedelta(days=2)),
        ),
        models.Supplier(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            name="Manila Grain Co.",
            contact="Ben Torres",
            phone="+63 917 555 0223",
            categories=["Carbohydrates & Sides"],
            rating=4.2,
            on_time_rate=88.0,
            status="Active",
            last_delivery=str(today - timedelta(days=5)),
        ),
        models.Supplier(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            name="Fresh Valley Dairy",
            contact="Carla Santos",
            phone="+63 917 555 0331",
            categories=["Dairy & Produce"],
            rating=4.8,
            on_time_rate=97.0,
            status="Active",
            last_delivery=str(today - timedelta(days=1)),
        ),
    ]
    db.add_all(suppliers)

    inventory_specs = [
        ("Chicken Thighs", "Meats & Proteins", suppliers[0], "kg", 40, 60, 20, 145.0),
        ("Chicken Breast", "Meats & Proteins", suppliers[0], "kg", 25, 50, 15, 165.0),
        ("Steamed Rice", "Carbohydrates & Sides", suppliers[1], "kg", 80, 100, 30, 48.0),
        ("Buttered Corn", "Carbohydrates & Sides", suppliers[1], "kg", 18, 40, 12, 60.0),
        ("Fresh Milk", "Dairy & Produce", suppliers[2], "L", 12, 30, 10, 95.0),
        ("Gravy Base", "Sauces, Dips & Seasonings", None, "L", 6, 20, 8, 120.0),
    ]
    inventory: list[models.InventoryItem] = []
    for name, category, supplier, unit, qty, par, reorder, cost in inventory_specs:
        item = models.InventoryItem(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            name=name,
            category=category,
            supplier_id=supplier.id if supplier else None,
            unit=unit,
            quantity=qty,
            par=par,
            reorder_point=reorder,
            unit_cost=cost,
            created_at=datetime.utcnow(),
        )
        inventory.append(item)
    db.add_all(inventory)

    purchase_records = [
        models.PurchaseRecord(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            item_id=inventory[0].id,
            supplier_id=suppliers[0].id,
            date=str(today - timedelta(days=6)),
            expected_delivery=str(today - timedelta(days=4)),
            quantity=50,
            unit_price=140.0,
            delivered=True,
        ),
        models.PurchaseRecord(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            item_id=inventory[2].id,
            supplier_id=suppliers[1].id,
            date=str(today - timedelta(days=3)),
            expected_delivery=str(today + timedelta(days=1)),
            quantity=100,
            unit_price=47.0,
            delivered=False,
        ),
    ]
    db.add_all(purchase_records)

    customers = [
        models.Customer(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            name="Maria Dela Cruz",
            email="maria@example.com",
            phone="+63 917 555 1001",
            join_date=str(today - timedelta(days=120)),
            loyalty_points=340,
            tier="Gold",
            favorite_items=["Chicken Thighs", "Steamed Rice"],
            tags=["regular", "vip"],
        ),
        models.Customer(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            name="Jose Ramirez",
            email="jose@example.com",
            phone="+63 917 555 1002",
            join_date=str(today - timedelta(days=40)),
            loyalty_points=90,
            tier="Bronze",
            favorite_items=["Chicken Breast"],
            tags=["new"],
        ),
    ]
    db.add_all(customers)

    orders = [
        models.CustomerOrder(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            customer_id=customers[0].id,
            date=str(today - timedelta(days=2)),
            items=[{"name": "Chicken Thighs", "qty": 2, "price": 145.0}],
            total=290.0,
            status="Completed",
        ),
    ]
    db.add_all(orders)

    feedback = [
        models.FeedbackRecord(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            customer_id=customers[0].id,
            order_id=orders[0].id,
            date=str(today - timedelta(days=1)),
            rating=5,
            comment="Always fresh and delivered on time!",
        ),
    ]
    db.add_all(feedback)

    promotions = [
        models.Promotion(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            title="Gold Tier Chicken Discount",
            description="10% off chicken items for Gold-tier customers.",
            discount="10%",
            linked_inventory_item_id=inventory[0].id,
            linked_menu_items=["Chicken Thighs"],
            target_tiers=["Gold"],
            target_customer_ids=[],
            expires_on=str(today + timedelta(days=14)),
            status="Draft",
            reason="High repeat purchase rate among Gold-tier customers.",
        ),
    ]
    db.add_all(promotions)
