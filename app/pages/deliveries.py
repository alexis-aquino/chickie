from datetime import date

import streamlit as st

from app import store
from app.utils import format_date, parse_date, supplier_name


def _badge(rec: dict) -> str:
    if rec["delivered"]:
        return "✅ Delivered"
    expected = parse_date(rec["expected_delivery"])
    today = date.today()
    if expected is None:
        return ""
    diff = (expected - today).days
    if expected < today:
        return f"🔴 Overdue {abs(diff)}d"
    if expected == today:
        return "🟡 Today"
    return f"🔵 In {diff}d"


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]
    is_owner = user["role"] == "owner"

    purchase_history = store.list_purchase_history(org_id)
    inventory = {i["id"]: i for i in store.list_inventory(org_id)}
    suppliers = store.list_suppliers(org_id)

    st.title("📅 Delivery Schedule")

    today = date.today()
    pending = [r for r in purchase_history if not r["delivered"]]
    overdue = [r for r in pending if (parse_date(r["expected_delivery"]) or today) < today]
    delivered = [r for r in purchase_history if r["delivered"]]

    if "delivery_filter" not in st.session_state:
        st.session_state.delivery_filter = "pending"

    cols = st.columns(4)
    labels = [("pending", "Pending", len(pending)), ("overdue", "Overdue", len(overdue)),
              ("delivered", "Delivered", len(delivered)), ("all", "All Orders", len(purchase_history))]
    for col, (key, label, count) in zip(cols, labels):
        if col.button(f"{label}\n{count}", use_container_width=True):
            st.session_state.delivery_filter = key

    filt = st.session_state.delivery_filter
    if filt == "pending":
        rows = pending
    elif filt == "overdue":
        rows = overdue
    elif filt == "delivered":
        rows = delivered
    else:
        rows = purchase_history

    rows = sorted(rows, key=lambda r: r["expected_delivery"])

    st.divider()
    if not rows:
        st.info("Nothing to show for this filter.")
        return

    for rec in rows:
        item = inventory.get(rec["item_id"])
        with st.container(border=True):
            cols = st.columns([3, 2, 1.5, 1.5, 2, 2, 2])
            cols[0].markdown(f"**{item['name'] if item else 'Unknown item'}**")
            cols[1].write(supplier_name(suppliers, rec["supplier_id"]))
            cols[2].write(f"{rec['quantity']:g} {item['unit'] if item else ''}")
            cols[3].write(f"₱{rec['quantity'] * rec['unit_price']:,.2f}")
            cols[4].write(f"Ordered {format_date(rec['date'])}")
            cols[5].write(_badge(rec))
            if is_owner and not rec["delivered"]:
                if cols[6].button("Mark Delivered", key=f"deliver-{rec['id']}"):
                    store.mark_delivered(org_id, rec["id"])
                    st.toast("Marked as delivered.", icon="✅")
                    st.rerun()
