from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

UUID_LEN = 36


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime)


class User(Base):
    """Owns both auth credentials and profile/appearance fields — this
    backend is the sole identity provider now (no external auth service)."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(
        String(UUID_LEN), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32))
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str] = mapped_column(Text, default="")
    phone: Mapped[str] = mapped_column(String(64), default="")
    theme: Mapped[str] = mapped_column(String(32), default="default")
    accent_color: Mapped[str] = mapped_column(String(16), default="#dc2626")
    provider: Mapped[str] = mapped_column(String(16), default="email")
    created_at: Mapped[datetime] = mapped_column(DateTime)


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(64))
    categories: Mapped[list[str]] = mapped_column(JSON)
    rating: Mapped[float] = mapped_column(Numeric(4, 2))
    on_time_rate: Mapped[float] = mapped_column(Numeric(5, 2))
    status: Mapped[str] = mapped_column(String(32))
    last_delivery: Mapped[str | None] = mapped_column(String(32), nullable=True)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    supplier_id: Mapped[str | None] = mapped_column(
        String(UUID_LEN), ForeignKey("suppliers.id"), nullable=True
    )
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 2))
    par: Mapped[float] = mapped_column(Numeric(12, 2))
    reorder_point: Mapped[float] = mapped_column(Numeric(12, 2))
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime)


class PurchaseRecord(Base):
    __tablename__ = "purchase_records"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("organizations.id"))
    item_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("inventory_items.id"))
    supplier_id: Mapped[str | None] = mapped_column(
        String(UUID_LEN), ForeignKey("suppliers.id"), nullable=True
    )
    date: Mapped[str] = mapped_column(String(32), nullable=False)
    expected_delivery: Mapped[str] = mapped_column(String(32), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 2))
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2))
    delivered: Mapped[bool] = mapped_column(Boolean)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(64))
    join_date: Mapped[str] = mapped_column(String(32))
    loyalty_points: Mapped[int] = mapped_column()
    tier: Mapped[str] = mapped_column(String(32))
    favorite_items: Mapped[list[str]] = mapped_column(JSON)
    tags: Mapped[list[str]] = mapped_column(JSON)


class CustomerOrder(Base):
    __tablename__ = "customer_orders"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("organizations.id"))
    customer_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("customers.id"))
    date: Mapped[str] = mapped_column(String(32), nullable=False)
    items: Mapped[list] = mapped_column(JSON)
    total: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(32))


class FeedbackRecord(Base):
    __tablename__ = "feedback_records"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("organizations.id"))
    customer_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("customers.id"))
    order_id: Mapped[str | None] = mapped_column(
        String(UUID_LEN), ForeignKey("customer_orders.id"), nullable=True
    )
    date: Mapped[str] = mapped_column(String(32), nullable=False)
    rating: Mapped[int] = mapped_column()
    comment: Mapped[str] = mapped_column(Text)


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[str] = mapped_column(String(UUID_LEN), primary_key=True)
    organization_id: Mapped[str] = mapped_column(String(UUID_LEN), ForeignKey("organizations.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    discount: Mapped[str] = mapped_column(String(64))
    linked_inventory_item_id: Mapped[str | None] = mapped_column(
        String(UUID_LEN), ForeignKey("inventory_items.id"), nullable=True
    )
    linked_menu_items: Mapped[list[str]] = mapped_column(JSON)
    target_tiers: Mapped[list[str]] = mapped_column(JSON)
    target_customer_ids: Mapped[list[str]] = mapped_column(JSON)
    expires_on: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32))
    reason: Mapped[str] = mapped_column(Text)
