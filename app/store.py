import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select

from app import models
from app.db import SessionLocal


def _num(v: Any) -> float:
    return float(v) if v is not None else 0.0


def _supplier_dict(s: models.Supplier) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "contact": s.contact,
        "phone": s.phone,
        "categories": list(s.categories or []),
        "rating": _num(s.rating),
        "on_time_rate": _num(s.on_time_rate),
        "status": s.status,
        "last_delivery": s.last_delivery or "",
    }


def _inventory_dict(i: models.InventoryItem) -> dict:
    return {
        "id": i.id,
        "name": i.name,
        "category": i.category,
        "supplier_id": i.supplier_id,
        "unit": i.unit,
        "quantity": _num(i.quantity),
        "par": _num(i.par),
        "reorder_point": _num(i.reorder_point),
        "unit_cost": _num(i.unit_cost),
    }


def _purchase_dict(p: models.PurchaseRecord) -> dict:
    return {
        "id": p.id,
        "item_id": p.item_id,
        "supplier_id": p.supplier_id,
        "date": p.date,
        "expected_delivery": p.expected_delivery,
        "quantity": _num(p.quantity),
        "unit_price": _num(p.unit_price),
        "delivered": bool(p.delivered),
    }


def _order_dict(o: models.CustomerOrder) -> dict:
    return {
        "id": o.id,
        "date": o.date,
        "items": o.items or [],
        "total": _num(o.total),
        "status": o.status,
    }


def _feedback_dict(f: models.FeedbackRecord) -> dict:
    return {
        "id": f.id,
        "order_id": f.order_id,
        "date": f.date,
        "rating": int(f.rating),
        "comment": f.comment,
    }


def _customer_dict(c: models.Customer, orders: list[models.CustomerOrder], feedback: list[models.FeedbackRecord]) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "join_date": c.join_date,
        "loyalty_points": int(c.loyalty_points),
        "tier": c.tier,
        "favorite_items": list(c.favorite_items or []),
        "tags": list(c.tags or []),
        "orders": [_order_dict(o) for o in orders],
        "feedback": [_feedback_dict(f) for f in feedback],
    }


def _promotion_dict(p: models.Promotion) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "discount": p.discount,
        "linked_inventory_item_id": p.linked_inventory_item_id,
        "linked_menu_items": list(p.linked_menu_items or []),
        "target_tiers": list(p.target_tiers or []),
        "target_customer_ids": list(p.target_customer_ids or []),
        "expires_on": p.expires_on,
        "status": p.status,
        "reason": p.reason,
    }


def list_suppliers(org_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = db.scalars(
            select(models.Supplier).where(models.Supplier.organization_id == org_id).order_by(models.Supplier.name)
        ).all()
        return [_supplier_dict(s) for s in rows]


def list_inventory(org_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = db.scalars(
            select(models.InventoryItem)
            .where(models.InventoryItem.organization_id == org_id)
            .order_by(models.InventoryItem.name)
        ).all()
        return [_inventory_dict(i) for i in rows]


def list_purchase_history(org_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = db.scalars(
            select(models.PurchaseRecord)
            .where(models.PurchaseRecord.organization_id == org_id)
            .order_by(models.PurchaseRecord.date.desc())
        ).all()
        return [_purchase_dict(p) for p in rows]


def list_customers(org_id: str) -> list[dict]:
    with SessionLocal() as db:
        customers = db.scalars(
            select(models.Customer).where(models.Customer.organization_id == org_id).order_by(models.Customer.name)
        ).all()
        orders = db.scalars(
            select(models.CustomerOrder)
            .where(models.CustomerOrder.organization_id == org_id)
            .order_by(models.CustomerOrder.date.desc())
        ).all()
        feedback = db.scalars(
            select(models.FeedbackRecord)
            .where(models.FeedbackRecord.organization_id == org_id)
            .order_by(models.FeedbackRecord.date.desc())
        ).all()

        orders_by_customer: dict[str, list[models.CustomerOrder]] = {}
        for o in orders:
            orders_by_customer.setdefault(o.customer_id, []).append(o)
        feedback_by_customer: dict[str, list[models.FeedbackRecord]] = {}
        for f in feedback:
            feedback_by_customer.setdefault(f.customer_id, []).append(f)

        return [
            _customer_dict(c, orders_by_customer.get(c.id, []), feedback_by_customer.get(c.id, []))
            for c in customers
        ]


def list_promotions(org_id: str) -> list[dict]:
    with SessionLocal() as db:
        rows = db.scalars(select(models.Promotion).where(models.Promotion.organization_id == org_id)).all()
        return [_promotion_dict(p) for p in rows]


def add_inventory_item(org_id: str, **fields) -> dict:
    with SessionLocal() as db:
        row = models.InventoryItem(
            id=str(uuid.uuid4()),
            organization_id=org_id,
            created_at=datetime.utcnow(),
            **fields,
        )
        db.add(row)
        db.commit()
        return _inventory_dict(row)


def update_inventory_item(org_id: str, item_id: str, **fields) -> dict | None:
    with SessionLocal() as db:
        row = db.get(models.InventoryItem, item_id)
        if row is None or row.organization_id != org_id:
            return None
        for key, value in fields.items():
            setattr(row, key, value)
        db.commit()
        return _inventory_dict(row)


def delete_inventory_item(org_id: str, item_id: str) -> bool:
    with SessionLocal() as db:
        row = db.get(models.InventoryItem, item_id)
        if row is None or row.organization_id != org_id:
            return False
        # Deleting an item cascades to its purchase records via the DB FK.
        db.delete(row)
        db.commit()
        return True


def submit_order(org_id: str, lines: list[dict]) -> list[dict]:
    """Inserts one PurchaseRecord per line, then bumps each affected inventory
    item's on-hand quantity immediately (not at delivery time), overwriting
    its unit cost/supplier with the last line submitted for that item."""
    with SessionLocal() as db:
        inserted: list[models.PurchaseRecord] = []
        for line in lines:
            row = models.PurchaseRecord(
                id=str(uuid.uuid4()),
                organization_id=org_id,
                item_id=line["item_id"],
                supplier_id=line.get("supplier_id"),
                date=line["date"],
                expected_delivery=line["expected_delivery"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                delivered=False,
            )
            db.add(row)
            inserted.append(row)
        db.flush()

        by_item: dict[str, dict[str, Any]] = {}
        for r in inserted:
            agg = by_item.setdefault(r.item_id, {"qty": 0.0, "price": r.unit_price, "supplier_id": r.supplier_id})
            agg["qty"] += float(r.quantity)
            agg["price"] = r.unit_price
            if r.supplier_id is not None:
                agg["supplier_id"] = r.supplier_id

        for item_id, agg in by_item.items():
            item = db.get(models.InventoryItem, item_id)
            if item is None or item.organization_id != org_id:
                continue
            item.quantity = float(item.quantity) + agg["qty"]
            item.unit_cost = agg["price"]
            if agg["supplier_id"] is not None:
                item.supplier_id = agg["supplier_id"]

        db.commit()
        return [_purchase_dict(r) for r in inserted]


def mark_delivered(org_id: str, record_id: str) -> bool:
    with SessionLocal() as db:
        row = db.get(models.PurchaseRecord, record_id)
        if row is None or row.organization_id != org_id:
            return False
        row.delivered = True
        db.commit()
        return True


def activate_promotion(org_id: str, promo_id: str) -> bool:
    with SessionLocal() as db:
        row = db.get(models.Promotion, promo_id)
        if row is None or row.organization_id != org_id:
            return False
        row.status = "Active"
        db.commit()
        return True
