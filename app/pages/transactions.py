from datetime import date, timedelta

import streamlit as st

from app import store
from app.utils import parse_date, supplier_name

PAGE_SIZE = 10


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    inventory = {i["id"]: i for i in store.list_inventory(org_id)}
    suppliers = store.list_suppliers(org_id)
    records = store.list_purchase_history(org_id)

    st.title("💳 Transactions")

    total_spend = round(sum(r["quantity"] * r["unit_price"] for r in records))
    today = date.today()
    this_month = sum(
        r["quantity"] * r["unit_price"]
        for r in records
        if (d := parse_date(r["date"])) and d.year == today.year and d.month == today.month
    )
    last_month_date = today.replace(day=1) - timedelta(days=1)
    last_month = sum(
        r["quantity"] * r["unit_price"]
        for r in records
        if (d := parse_date(r["date"])) and d.year == last_month_date.year and d.month == last_month_date.month
    )
    mom = (this_month - last_month) / last_month * 100 if last_month > 0 else 0.0
    delivered_count = sum(1 for r in records if r["delivered"])
    pending_count = len(records) - delivered_count
    suppliers_used = len({r["supplier_id"] for r in records if r["supplier_id"]})

    cols = st.columns(6)
    cols[0].metric("Total Spend", f"₱{total_spend:,}", help=f"{len(records)} transactions")
    cols[1].metric("This Month", f"₱{this_month:,.0f}", f"{mom:+.1f}% vs last month", delta_color="inverse")
    cols[2].metric("Delivered", delivered_count)
    cols[3].metric("Pending", pending_count)
    cols[4].metric("Suppliers Used", suppliers_used)

    top = st.columns([3, 2, 2])
    search = top[0].text_input("Search", placeholder="Item, supplier, or date…", label_visibility="collapsed")
    status_filter = top[1].selectbox("Status", ["All", "Delivered", "Pending"])
    sort_option = top[2].selectbox("Sort", ["Date (newest)", "Date (oldest)", "Total (high→low)", "Total (low→high)"])

    rows = records
    if search:
        s = search.lower()
        rows = [
            r for r in rows
            if s in (inventory.get(r["item_id"], {}).get("name", "")).lower()
            or s in supplier_name(suppliers, r["supplier_id"]).lower()
            or s in r["date"].lower()
        ]
    if status_filter == "Delivered":
        rows = [r for r in rows if r["delivered"]]
    elif status_filter == "Pending":
        rows = [r for r in rows if not r["delivered"]]

    if sort_option == "Date (newest)":
        rows = sorted(rows, key=lambda r: r["date"], reverse=True)
    elif sort_option == "Date (oldest)":
        rows = sorted(rows, key=lambda r: r["date"])
    elif sort_option == "Total (high→low)":
        rows = sorted(rows, key=lambda r: r["quantity"] * r["unit_price"], reverse=True)
    else:
        rows = sorted(rows, key=lambda r: r["quantity"] * r["unit_price"])

    total_pages = max(1, (len(rows) + PAGE_SIZE - 1) // PAGE_SIZE)
    if "txn_page" not in st.session_state:
        st.session_state.txn_page = 1
    st.session_state.txn_page = min(st.session_state.txn_page, total_pages)
    page = st.session_state.txn_page

    start = (page - 1) * PAGE_SIZE
    page_rows = rows[start : start + PAGE_SIZE]

    st.divider()
    if not page_rows:
        st.info("No transactions match your filters.")
        return

    for offset, r in enumerate(page_rows):
        txn_id = f"TXN-{start + offset + 1:04d}"
        item = inventory.get(r["item_id"])
        with st.container(border=True):
            cols = st.columns([1.2, 2, 2, 1, 1.5, 1.5, 1.5, 1.5, 1.5])
            cols[0].caption(txn_id)
            cols[1].write(item["name"] if item else "Unknown item")
            cols[2].write(supplier_name(suppliers, r["supplier_id"]))
            cols[3].write(f"{r['quantity']:g}")
            cols[4].write(f"₱{r['unit_price']:.2f}")
            cols[5].write(f"₱{r['quantity'] * r['unit_price']:,.2f}")
            cols[6].write(r["date"])
            cols[7].write(r["expected_delivery"])
            cols[8].write("✅ Delivered" if r["delivered"] else "⏳ Pending")

    page_total = sum(r["quantity"] * r["unit_price"] for r in page_rows)
    st.caption(f"Page total: ₱{page_total:,.2f}")

    nav = st.columns([1, 1, 3, 1, 1])
    if nav[0].button("◀ Previous", disabled=page <= 1):
        st.session_state.txn_page -= 1
        st.rerun()
    nav[2].markdown(f"<div style='text-align:center'>Page {page} of {total_pages}</div>", unsafe_allow_html=True)
    if nav[4].button("Next ▶", disabled=page >= total_pages):
        st.session_state.txn_page += 1
        st.rerun()
