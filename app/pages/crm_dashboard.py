import streamlit as st

from app import store
from app.utils import TIER_CONFIG, TIER_ORDER, avg_rating, format_date, initials, total_spent


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    customers = store.list_customers(org_id)
    inventory = {i["id"]: i for i in store.list_inventory(org_id)}
    promotions = store.list_promotions(org_id)

    st.title("❤️ CRM Dashboard")

    total = len(customers)
    repeat = sum(1 for c in customers if len(c["orders"]) > 1)
    repeat_pct = round(repeat / total * 100) if total else 0

    completed_orders = [o for c in customers for o in c["orders"] if o["status"] == "Completed"]
    revenue = sum(o["total"] for o in completed_orders)
    avg_order = round(revenue / len(completed_orders)) if completed_orders else 0

    all_feedback = [f for c in customers for f in c["feedback"]]
    avg_satisfaction = f"{sum(f['rating'] for f in all_feedback) / len(all_feedback):.1f}" if all_feedback else "—"

    cols = st.columns(4)
    cols[0].metric("Total Customers", total, f"{repeat} repeat")
    cols[1].metric("Repeat Rate", f"{repeat_pct}%")
    cols[2].metric("Total Revenue", f"₱{revenue:,.0f}", f"avg ₱{avg_order:,}/order")
    cols[3].metric("Avg Satisfaction", f"{avg_satisfaction} ⭐")

    st.divider()
    left, right = st.columns(2)

    with left:
        st.subheader("Top Spenders")
        top_spenders = sorted(customers, key=total_spent, reverse=True)[:5]
        for rank, c in enumerate(top_spenders, start=1):
            rating = avg_rating(c)
            with st.container(border=True):
                cols = st.columns([0.5, 3, 2, 2])
                cols[0].write(f"#{rank}")
                cols[1].markdown(f"**{initials(c['name'])} {c['name']}**  \n:gray[{c['tier']}]")
                cols[2].write(f"{len(c['orders'])} orders")
                cols[2].caption(f"{rating:.1f} ⭐" if rating is not None else "No reviews")
                cols[3].markdown(f"**₱{total_spent(c):,.2f}**")

    with right:
        st.subheader("SCM-Triggered Promotions")
        alerts = []
        for p in promotions:
            if p["status"] != "Active":
                continue
            item = inventory.get(p["linked_inventory_item_id"])
            if item is not None:
                alerts.append((p, item))
        if not alerts:
            st.caption("No active SCM-triggered promotions right now.")
        for promo, item in alerts:
            pct = round(item["quantity"] / item["par"] * 100) if item["par"] else 0
            with st.container(border=True):
                st.markdown(f"**{promo['title']}** — `{promo['discount']}`")
                st.caption(promo["reason"])
                st.caption(f"{item['name']}: {pct}% of par · {len(promo['target_customer_ids'])} targeted · expires {format_date(promo['expires_on']) if promo['expires_on'] else '—'}")

        st.subheader("Loyalty Tier Distribution")
        for tier in TIER_ORDER:
            count = sum(1 for c in customers if c["tier"] == tier)
            pct = round(count / total * 100) if total else 0
            st.write(f"{tier} — {count} customers ({pct}%)")
            st.progress(pct / 100)
