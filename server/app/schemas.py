from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class Supplier(CamelModel):
    id: str
    name: str
    contact: str
    phone: str
    categories: list[str]
    rating: float
    on_time_rate: float
    status: str
    last_delivery: str


class InventoryItem(CamelModel):
    id: str
    name: str
    category: str
    supplier_id: str
    unit: str
    quantity: float
    par: float
    reorder_point: float
    unit_cost: float


class SupplierWrite(CamelModel):
    name: str
    contact: str
    phone: str
    categories: list[str]
    status: str = "Active"


class InventoryItemWrite(CamelModel):
    name: str
    category: str
    supplier_id: str
    unit: str
    quantity: float
    par: float
    reorder_point: float
    unit_cost: float


class PurchaseRecord(CamelModel):
    id: str
    item_id: str
    supplier_id: str
    date: str
    expected_delivery: str
    quantity: float
    unit_price: float
    delivered: bool
    payment_method: str


class PurchaseRecordWrite(CamelModel):
    item_id: str
    supplier_id: str
    date: str
    expected_delivery: str
    quantity: float
    unit_price: float
    payment_method: str = "Cash"


class CustomerOrderItem(CamelModel):
    name: str
    qty: float
    price: float


class CustomerOrder(CamelModel):
    id: str
    date: str
    items: list[CustomerOrderItem]
    total: float
    status: str


class FeedbackRecord(CamelModel):
    id: str
    order_id: str
    date: str
    rating: int
    comment: str


class Customer(CamelModel):
    id: str
    name: str
    email: str
    phone: str
    join_date: str
    loyalty_points: int
    tier: str
    orders: list[CustomerOrder]
    feedback: list[FeedbackRecord]
    favorite_items: list[str]
    tags: list[str]


class Promotion(CamelModel):
    id: str
    title: str
    description: str
    discount: str
    linked_inventory_item_id: str
    linked_menu_items: list[str]
    target_tiers: list[str]
    target_customer_ids: list[str]
    expires_on: str
    status: str
    reason: str


class StoreSnapshot(CamelModel):
    suppliers: list[Supplier]
    inventory: list[InventoryItem]
    purchase_history: list[PurchaseRecord]
    customers: list[Customer]
    promotions: list[Promotion]
