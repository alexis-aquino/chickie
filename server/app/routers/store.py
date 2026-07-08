import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import Principal, get_current_principal
from app.db import get_db

router = APIRouter(prefix="/api", tags=["store"])


def _s(v: Any) -> str:
    if v is None:
        return ""
    return v.isoformat() if hasattr(v, "isoformat") else str(v)


def _num(v: Any) -> float:
    return float(v) if v is not None else 0.0


def _supplier(s: models.Supplier) -> schemas.Supplier:
    return schemas.Supplier(
        id=str(s.id),
        name=s.name,
        contact=s.contact,
        phone=s.phone,
        categories=list(s.categories or []),
        rating=_num(s.rating),
        on_time_rate=_num(s.on_time_rate),
        status=s.status,
        last_delivery=_s(s.last_delivery),
    )


def _inventory_item(i: models.InventoryItem) -> schemas.InventoryItem:
    return schemas.InventoryItem(
        id=str(i.id),
        name=i.name,
        category=i.category,
        supplier_id=_s(i.supplier_id),
        unit=i.unit,
        quantity=_num(i.quantity),
        par=_num(i.par),
        reorder_point=_num(i.reorder_point),
        unit_cost=_num(i.unit_cost),
    )


def _purchase_record(p: models.PurchaseRecord) -> schemas.PurchaseRecord:
    return schemas.PurchaseRecord(
        id=str(p.id),
        item_id=str(p.item_id),
        supplier_id=_s(p.supplier_id),
        date=_s(p.date),
        expected_delivery=_s(p.expected_delivery),
        quantity=_num(p.quantity),
        unit_price=_num(p.unit_price),
        delivered=bool(p.delivered),
    )


def _feedback_record(f: models.FeedbackRecord) -> schemas.FeedbackRecord:
    return schemas.FeedbackRecord(
        id=str(f.id),
        order_id=_s(f.order_id),
        date=_s(f.date),
        rating=int(f.rating),
        comment=f.comment,
    )


def _customer_order(o: models.CustomerOrder) -> schemas.CustomerOrder:
    return schemas.CustomerOrder(
        id=str(o.id),
        date=_s(o.date),
        items=o.items or [],
        total=_num(o.total),
        status=o.status,
    )


def _customer(
    c: models.Customer, orders: list[models.CustomerOrder], feedback: list[models.FeedbackRecord]
) -> schemas.Customer:
    return schemas.Customer(
        id=str(c.id),
        name=c.name,
        email=c.email,
        phone=c.phone,
        join_date=_s(c.join_date),
        loyalty_points=int(c.loyalty_points),
        tier=c.tier,
        orders=[_customer_order(o) for o in orders],
        feedback=[_feedback_record(f) for f in feedback],
        favorite_items=list(c.favorite_items or []),
        tags=list(c.tags or []),
    )


def _promotion(p: models.Promotion) -> schemas.Promotion:
    return schemas.Promotion(
        id=str(p.id),
        title=p.title,
        description=p.description,
        discount=p.discount,
        linked_inventory_item_id=_s(p.linked_inventory_item_id),
        linked_menu_items=list(p.linked_menu_items or []),
        target_tiers=list(p.target_tiers or []),
        target_customer_ids=list(p.target_customer_ids or []),
        expires_on=_s(p.expires_on),
        status=p.status,
        reason=p.reason,
    )


def _parse_uuid(value: str, field: str) -> str:
    try:
        return str(uuid.UUID(value))
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid {field}: {value!r}")


@router.get("/store", response_model=schemas.StoreSnapshot)
def get_store(
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> schemas.StoreSnapshot:
    org_id = principal.organization_id

    suppliers = db.scalars(
        select(models.Supplier).where(models.Supplier.organization_id == org_id).order_by(models.Supplier.name)
    ).all()
    inventory = db.scalars(
        select(models.InventoryItem)
        .where(models.InventoryItem.organization_id == org_id)
        .order_by(models.InventoryItem.name)
    ).all()
    purchase_history = db.scalars(
        select(models.PurchaseRecord)
        .where(models.PurchaseRecord.organization_id == org_id)
        .order_by(models.PurchaseRecord.date.desc())
    ).all()
    customer_rows = db.scalars(
        select(models.Customer).where(models.Customer.organization_id == org_id).order_by(models.Customer.name)
    ).all()
    order_rows = db.scalars(
        select(models.CustomerOrder)
        .where(models.CustomerOrder.organization_id == org_id)
        .order_by(models.CustomerOrder.date.desc())
    ).all()
    feedback_rows = db.scalars(
        select(models.FeedbackRecord)
        .where(models.FeedbackRecord.organization_id == org_id)
        .order_by(models.FeedbackRecord.date.desc())
    ).all()
    promotions = db.scalars(select(models.Promotion).where(models.Promotion.organization_id == org_id)).all()

    orders_by_customer: dict[str, list[models.CustomerOrder]] = {}
    for o in order_rows:
        orders_by_customer.setdefault(str(o.customer_id), []).append(o)

    feedback_by_customer: dict[str, list[models.FeedbackRecord]] = {}
    for f in feedback_rows:
        feedback_by_customer.setdefault(str(f.customer_id), []).append(f)

    return schemas.StoreSnapshot(
        suppliers=[_supplier(s) for s in suppliers],
        inventory=[_inventory_item(i) for i in inventory],
        purchase_history=[_purchase_record(p) for p in purchase_history],
        customers=[
            _customer(c, orders_by_customer.get(str(c.id), []), feedback_by_customer.get(str(c.id), []))
            for c in customer_rows
        ],
        promotions=[_promotion(p) for p in promotions],
    )


@router.post("/purchase-records", response_model=list[schemas.PurchaseRecord])
def submit_purchase_records(
    records: list[schemas.PurchaseRecordWrite],
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[schemas.PurchaseRecord]:
    org_id = principal.organization_id

    inserted: list[models.PurchaseRecord] = []
    for r in records:
        row = models.PurchaseRecord(
            id=str(uuid.uuid4()),
            organization_id=org_id,
            item_id=_parse_uuid(r.item_id, "itemId"),
            supplier_id=_parse_uuid(r.supplier_id, "supplierId") if r.supplier_id else None,
            date=r.date,
            expected_delivery=r.expected_delivery,
            quantity=r.quantity,
            unit_price=r.unit_price,
            delivered=False,
        )
        db.add(row)
        inserted.append(row)
    db.flush()

    # Mirror the "latest order updates on-hand stock" behavior: aggregate the
    # quantity delivered per item across all lines just inserted, then bump
    # each affected inventory item's stock, cost, and supplier in one go.
    by_item: dict[str, dict[str, Any]] = {}
    for r in inserted:
        agg = by_item.setdefault(r.item_id, {"qty": 0.0, "price": r.unit_price, "supplier_id": r.supplier_id})
        agg["qty"] += float(r.quantity)
        agg["price"] = r.unit_price
        if r.supplier_id is not None:
            agg["supplier_id"] = r.supplier_id

    for item_id, agg in by_item.items():
        item = db.get(models.InventoryItem, item_id)
        if item is None or str(item.organization_id) != org_id:
            continue
        item.quantity = float(item.quantity) + agg["qty"]
        item.unit_cost = agg["price"]
        if agg["supplier_id"] is not None:
            item.supplier_id = agg["supplier_id"]

    db.commit()
    return [_purchase_record(r) for r in inserted]


@router.patch("/purchase-records/{record_id}/deliver", response_model=schemas.PurchaseRecord)
def mark_delivered(
    record_id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> schemas.PurchaseRecord:
    row = db.get(models.PurchaseRecord, _parse_uuid(record_id, "id"))
    if row is None or str(row.organization_id) != principal.organization_id:
        raise HTTPException(status_code=404, detail="Purchase record not found")
    row.delivered = True
    db.commit()
    return _purchase_record(row)


@router.post("/inventory-items", response_model=schemas.InventoryItem)
def create_inventory_item(
    item: schemas.InventoryItemWrite,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> schemas.InventoryItem:
    row = models.InventoryItem(
        id=str(uuid.uuid4()),
        organization_id=principal.organization_id,
        name=item.name,
        category=item.category,
        supplier_id=_parse_uuid(item.supplier_id, "supplierId") if item.supplier_id else None,
        unit=item.unit,
        quantity=item.quantity,
        par=item.par,
        reorder_point=item.reorder_point,
        unit_cost=item.unit_cost,
    )
    db.add(row)
    db.commit()
    return _inventory_item(row)


@router.patch("/inventory-items/{item_id}", response_model=schemas.InventoryItem)
def update_inventory_item(
    item_id: str,
    patch: schemas.InventoryItemWrite,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> schemas.InventoryItem:
    row = db.get(models.InventoryItem, _parse_uuid(item_id, "id"))
    if row is None or str(row.organization_id) != principal.organization_id:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    row.name = patch.name
    row.category = patch.category
    row.supplier_id = _parse_uuid(patch.supplier_id, "supplierId") if patch.supplier_id else None
    row.unit = patch.unit
    row.quantity = patch.quantity
    row.par = patch.par
    row.reorder_point = patch.reorder_point
    row.unit_cost = patch.unit_cost
    db.commit()
    return _inventory_item(row)


@router.delete("/inventory-items/{item_id}", status_code=204)
def delete_inventory_item(
    item_id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> None:
    row = db.get(models.InventoryItem, _parse_uuid(item_id, "id"))
    if row is None or str(row.organization_id) != principal.organization_id:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    # Deleting an item cascades to its purchase records via the existing DB FK.
    db.delete(row)
    db.commit()


@router.patch("/promotions/{promotion_id}/activate", response_model=schemas.Promotion)
def activate_promotion(
    promotion_id: str,
    principal: Principal = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> schemas.Promotion:
    row = db.get(models.Promotion, _parse_uuid(promotion_id, "id"))
    if row is None or str(row.organization_id) != principal.organization_id:
        raise HTTPException(status_code=404, detail="Promotion not found")
    row.status = "Active"
    db.commit()
    return _promotion(row)
