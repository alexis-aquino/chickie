import streamlit as st

from app import store
from app.utils import TIER_CONFIG, avg_rating, format_date, initials, next_tier, total_spent


def _detail(customer: dict) -> None:
    st.divider()
    st.subheader(f"{initials(customer['name'])} {customer['name']}")
    cols = st.columns(4)
    cols[0].metric("Phone", customer["phone"] or "—")
    cols[1].metric("Email", customer["email"] or "—")
    cols[2].metric("Joined", format_date(customer["join_date"], "month-year"))
    cols[3].metric("Orders", len(customer["orders"]))

    st.write("**Loyalty Points**")
    nt = next_tier(customer["tier"])
    if nt:
        threshold = TIER_CONFIG[nt]["min"]
        pts_to_next = max(0, threshold - customer["loyalty_points"])
        pct = min(100, round(customer["loyalty_points"] / threshold * 100)) if threshold else 100
        st.progress(pct / 100, text=f"{customer['loyalty_points']:,} pts — {pts_to_next:,} pts to {nt}")
    else:
        st.progress(1.0, text=f"{customer['loyalty_points']:,} pts — Max tier reached")

    if customer["favorite_items"]:
        st.write("**Favorite Items**")
        st.write(" · ".join(customer["favorite_items"]))

    st.write(f"**Order History** — total ₱{total_spent(customer):,.2f}")
    if not customer["orders"]:
        st.caption("No orders yet.")
    for o in customer["orders"]:
        items_summary = ", ".join(f"{i['name']} ×{i['qty']:g}" for i in o["items"])
        st.write(f"{format_date(o['date'])} — ₱{o['total']:,.2f} ({o['status']}) — {items_summary}")

    if customer["feedback"]:
        st.write("**Feedback**")
        for f in customer["feedback"]:
            st.write(f"{'⭐' * f['rating']} {format_date(f['date'])} — {f['comment']}")


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    customers = store.list_customers(org_id)

    st.title("👥 Customers")

    top = st.columns([3, 2])
    search = top[0].text_input("Search", placeholder="Search by name or email…", label_visibility="collapsed")
    tier_filter = top[1].selectbox("Tier", ["All", "Gold", "Silver", "Bronze"])

    rows = customers
    if search:
        s = search.lower()
        rows = [c for c in rows if s in c["name"].lower() or s in c["email"].lower()]
    if tier_filter != "All":
        rows = [c for c in rows if c["tier"] == tier_filter]

    if not rows:
        st.info("No customers match your filters.")
        return

    for c in rows:
        rating = avg_rating(c)
        with st.container(border=True):
            cols = st.columns([3, 2, 1.5, 1.5, 1.5, 1.5, 1])
            cols[0].markdown(f"**{initials(c['name'])} {c['name']}**  \n:gray[{', '.join(c['tags']) if c['tags'] else '—'}]")
            cols[1].write(c["email"])
            cols[2].write(c["tier"])
            cols[3].write(f"{c['loyalty_points']:,} pts")
            cols[4].write(f"{len(c['orders'])} orders")
            cols[5].write(f"₱{total_spent(c):,.0f}")
            if cols[6].button("View", key=f"view-{c['id']}"):
                st.session_state.selected_customer_id = c["id"]

    selected_id = st.session_state.get("selected_customer_id")
    if selected_id:
        selected = next((c for c in customers if c["id"] == selected_id), None)
        if selected:
            _detail(selected)
