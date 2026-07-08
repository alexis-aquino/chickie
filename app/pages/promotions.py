import streamlit as st

from app import store
from app.utils import INVENTORY_TO_MENU_MAP, format_date, initials, stock_status

STATUS_BADGE = {"Active": "🟢 Active", "Draft": "⚪ Draft", "Expired": "🔴 Expired"}


def render() -> None:
    user = st.session_state.user
    org_id = user["organization_id"]

    inventory = store.list_inventory(org_id)
    inventory_by_id = {i["id"]: i for i in inventory}
    customers = {c["id"]: c for c in store.list_customers(org_id)}
    promotions = store.list_promotions(org_id)

    st.title("🎯 Promotions")

    linked_active_items = {
        p["linked_inventory_item_id"] for p in promotions if p["status"] == "Active" and p["linked_inventory_item_id"]
    }
    unlinked_alerts = [
        i
        for i in inventory
        if stock_status(i) in ("Low", "Critical")
        and i["id"] not in linked_active_items
        and i["name"] in INVENTORY_TO_MENU_MAP
    ]
    if unlinked_alerts:
        st.warning("**New Promotion Opportunities**")
        for item in unlinked_alerts:
            pct = round(item["quantity"] / item["par"] * 100) if item["par"] else 0
            menu_item = INVENTORY_TO_MENU_MAP[item["name"]][0]
            st.write(f"- **{item['name']}** is at {pct}% of par ({stock_status(item)}) — consider promoting `{menu_item}`")

    st.divider()
    if not promotions:
        st.info("No promotions yet.")
        return

    for p in promotions:
        item = inventory_by_id.get(p["linked_inventory_item_id"])
        targets = [customers[cid] for cid in p["target_customer_ids"] if cid in customers]
        with st.container(border=True):
            cols = st.columns([4, 1.5, 1.5])
            cols[0].markdown(f"### {p['title']}")
            cols[1].write(STATUS_BADGE.get(p["status"], p["status"]))
            if p["status"] == "Draft" and cols[2].button("Activate", key=f"activate-{p['id']}", type="primary"):
                store.activate_promotion(org_id, p["id"])
                st.toast(f'"{p["title"]}" is now active.', icon="✅")
                st.rerun()

            st.write(p["description"])
            st.caption(f"Discount: {p['discount']} · Expires: {format_date(p['expires_on']) if p['expires_on'] else '—'}")
            st.caption(f"SCM trigger: {p['reason']}")

            if item:
                pct = round(item["quantity"] / item["par"] * 100) if item["par"] else 0
                st.write(f"**Linked Inventory:** {item['name']} — {stock_status(item)} ({item['quantity']:g} {item['unit']} on hand · {pct}% of par)")
                st.progress(min(1.0, pct / 100))

            if p["linked_menu_items"]:
                st.write("**Affected Menu Items:** " + ", ".join(p["linked_menu_items"]))
            if p["target_tiers"]:
                st.write("**Target Tiers:** " + ", ".join(p["target_tiers"]))
            if targets:
                st.write(f"**Target Customers** ({len(targets)}):")
                st.write(" · ".join(f"{initials(t['name'])} {t['name']} ({t['tier']})" for t in targets))
