from datetime import date, timedelta

import streamlit as st

from app import store
from app.utils import CATEGORIES, format_date, supplier_name


@st.dialog("New Purchase Order")
def _create_order_dialog(inventory: list[dict], suppliers: list[dict], org_id: str):
    if "order_line_ids" not in st.session_state or not st.session_state.order_line_ids:
        st.session_state.order_line_ids = [0]
        st.session_state.order_line_seq = 1

    order_date = st.date_input("Order Date", value=date.today())
    expected = st.date_input("Expected Delivery", value=date.today() + timedelta(days=3), min_value=order_date)

    item_names = [i["name"] for i in inventory]
    supplier_names = [s["name"] for s in suppliers]

    st.write("**Line Items**")
    for line_id in list(st.session_state.order_line_ids):
        cols = st.columns([3, 2, 1.5, 1.5, 0.5])
        item_idx = cols[0].selectbox("Item", range(len(inventory)), format_func=lambda i: item_names[i], key=f"line-item-{line_id}") if inventory else None
        default_supplier = 0
        default_price = 0.0
        if item_idx is not None:
            picked = inventory[item_idx]
            if picked["supplier_id"] in [s["id"] for s in suppliers]:
                default_supplier = [s["id"] for s in suppliers].index(picked["supplier_id"])
            default_price = picked["unit_cost"]
        supplier_idx = cols[1].selectbox("Supplier", range(len(suppliers)), format_func=lambda i: supplier_names[i], key=f"line-supplier-{line_id}", index=default_supplier) if suppliers else None
        cols[2].number_input("Qty", min_value=0.0, key=f"line-qty-{line_id}")
        cols[3].number_input("Unit Price (₱)", min_value=0.0, value=default_price, key=f"line-price-{line_id}")
        if len(st.session_state.order_line_ids) > 1 and cols[4].button("🗑️", key=f"line-remove-{line_id}"):
            st.session_state.order_line_ids.remove(line_id)
            st.rerun()

    if st.button("➕ Add Item"):
        st.session_state.order_line_ids.append(st.session_state.order_line_seq)
        st.session_state.order_line_seq += 1
        st.rerun()

    total = sum(
        st.session_state.get(f"line-qty-{lid}", 0.0) * st.session_state.get(f"line-price-{lid}", 0.0)
        for lid in st.session_state.order_line_ids
    )
    st.metric("Order Total", f"₱{total:,.2f}")

    col1, col2 = st.columns(2)
    if col1.button("Cancel", use_container_width=True):
        del st.session_state.order_line_ids
        st.rerun()
    if col2.button("Place Order", type="primary", use_container_width=True):
        lines = []
        valid = True
        for lid in st.session_state.order_line_ids:
            item_idx = st.session_state.get(f"line-item-{lid}")
            supplier_idx = st.session_state.get(f"line-supplier-{lid}")
            qty = st.session_state.get(f"line-qty-{lid}", 0.0)
            price = st.session_state.get(f"line-price-{lid}", 0.0)
            if item_idx is None or qty <= 0 or price <= 0:
                valid = False
                break
            lines.append({
                "item_id": inventory[item_idx]["id"],
                "supplier_id": suppliers[supplier_idx]["id"] if supplier_idx is not None else None,
                "date": str(order_date),
                "expected_delivery": str(expected),
                "quantity": qty,
                "unit_price": price,
            })
        if not valid:
            st.error("Every line needs an item, quantity, and unit price greater than zero.")
            return
        store.submit_order(org_id, lines)
        st.toast(f"Order placed: {len(lines)} item(s), ₱{total:,.2f} total.", icon="✅")
        del st.session_state.order_line_ids
        st.rerun()


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]
    is_owner = user["role"] == "owner"

    inventory = store.list_inventory(org_id)
    suppliers = store.list_suppliers(org_id)
    purchase_history = store.list_purchase_history(org_id)

    st.title("🧾 Purchase History")

    total_spend = round(sum(r["quantity"] * r["unit_price"] for r in purchase_history))
    cols = st.columns(5)
    cols[0].metric("Total Orders", len(purchase_history))
    cols[1].metric("Total Spend", f"₱{total_spend:,}")
    cols[2].metric("Items Tracked", len(inventory))
    cols[3].metric("Active Suppliers", sum(1 for s in suppliers if s["status"] == "Active"))
    if is_owner and cols[4].button("➕ New Purchase Order", type="primary", use_container_width=True):
        _create_order_dialog(inventory, suppliers, org_id)

    search = st.text_input("Search", placeholder="Search by item name…", label_visibility="collapsed")
    category_filter = st.selectbox("Category", ["All"] + CATEGORIES)

    items = inventory
    if search:
        items = [i for i in items if search.lower() in i["name"].lower()]
    if category_filter != "All":
        items = [i for i in items if i["category"] == category_filter]

    by_item: dict[str, list[dict]] = {}
    for r in purchase_history:
        by_item.setdefault(r["item_id"], []).append(r)
    for records in by_item.values():
        records.sort(key=lambda r: r["date"], reverse=True)

    st.divider()
    for item in items:
        records = by_item.get(item["id"], [])
        with st.expander(f"{item['name']} — {len(records)} order(s)"):
            if not records:
                st.caption("No purchase history for this item yet.")
                continue
            item_total = sum(r["quantity"] * r["unit_price"] for r in records)
            for idx, r in enumerate(records):
                prev_price = records[idx + 1]["unit_price"] if idx + 1 < len(records) else None
                delta = f"{r['unit_price'] - prev_price:+.2f}" if prev_price is not None else None
                cols = st.columns([2, 2, 1, 1.5, 1.5])
                cols[0].write(format_date(r["date"]))
                cols[1].write(supplier_name(suppliers, r["supplier_id"]))
                cols[2].write(f"{r['quantity']:g}")
                cols[3].write(f"₱{r['unit_price']:.2f}" + (f" ({delta})" if delta else ""))
                cols[4].write(f"₱{r['quantity'] * r['unit_price']:,.2f}")
            st.caption(f"Total spend on {item['name']}: ₱{item_total:,.2f}")
