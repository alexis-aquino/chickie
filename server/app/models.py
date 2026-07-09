import datetime
import uuid

from sqlalchemy import ARRAY, Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True))


class Profile(Base):
    """Minimal mapping — profiles stay owned by the frontend's Supabase auth
    flow; the backend only reads id -> organization_id to scope queries."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    contact: Mapped[str] = mapped_column(String)
    phone: Mapped[str] = mapped_column(String)
    categories: Mapped[list[str]] = mapped_column(ARRAY(String))
    rating: Mapped[float] = mapped_column(Numeric)
    on_time_rate: Mapped[float] = mapped_column(Numeric)
    status: Mapped[str] = mapped_column(String)
    last_delivery: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True
    )
    unit: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric)
    par: Mapped[float] = mapped_column(Numeric)
    reorder_point: Mapped[float] = mapped_column(Numeric)
    unit_cost: Mapped[float] = mapped_column(Numeric)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True))


class PurchaseRecord(Base):
    __tablename__ = "purchase_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inventory_items.id"))
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True
    )
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    expected_delivery: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric)
    unit_price: Mapped[float] = mapped_column(Numeric)
    delivered: Mapped[bool] = mapped_column(Boolean)
    payment_method: Mapped[str] = mapped_column(String, default="Cash")
    actual_delivery: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String)
    phone: Mapped[str] = mapped_column(String)
    join_date: Mapped[datetime.date] = mapped_column(Date)
    loyalty_points: Mapped[int] = mapped_column()
    tier: Mapped[str] = mapped_column(String)
    favorite_items: Mapped[list[str]] = mapped_column(ARRAY(String))
    tags: Mapped[list[str]] = mapped_column(ARRAY(String))


class CustomerOrder(Base):
    __tablename__ = "customer_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"))
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    items: Mapped[dict] = mapped_column(JSONB)
    total: Mapped[float] = mapped_column(Numeric)
    status: Mapped[str] = mapped_column(String)


class FeedbackRecord(Base):
    __tablename__ = "feedback_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"))
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_orders.id"), nullable=True
    )
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    rating: Mapped[int] = mapped_column()
    comment: Mapped[str] = mapped_column(Text)


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text)
    discount: Mapped[str] = mapped_column(String)
    linked_inventory_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=True
    )
    linked_menu_items: Mapped[list[str]] = mapped_column(ARRAY(String))
    target_tiers: Mapped[list[str]] = mapped_column(ARRAY(String))
    target_customer_ids: Mapped[list[str]] = mapped_column(ARRAY(String))
    expires_on: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String)
    reason: Mapped[str] = mapped_column(Text)
